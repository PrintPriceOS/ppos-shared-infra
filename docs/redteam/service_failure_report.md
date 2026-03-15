# Red Team Report: Service Failure Simulation

## Audit Objective
Simulate the sudden death of critical infrastructure components (Redis, MySQL, Workers) to evaluate state recovery and job loss risk.

## Chaos Scenarios & Outcomes

### 💀 Scenario: "The Database Heart Attack" (MySQL Restart)
- **Action**: Kill `ppos-mysql` container during a high-load batch.
- **System Behavior**: `shared-infra/packages/data/db.js` pool throws `ECONNREFUSED`.
- **Outcome**: 🛑 **Fatal for Monolith**. The `query()` wrapper rejects but stays alive. However, the legacy app `server.js` doesn't have a global "Database Down" mitigation, so the UI simply shows "Error 500".
- **State Recovery**: BullMQ might retry if the error happened inside a worker, but if it happened during "Finish Job", the state is lost or inconsistent (Job "Done" in worker but not updated in DB).

### 💀 Scenario: "The Worker Massacre" (Kill Worker during PDF Fix)
- **Action**: `kill -9` on the `node worker.js` process while Ghostscript is running.
- **System Behavior**: The Ghostscript child process becomes an **orphaned zombie**.
- **Outcome**: ⚠️ **Zombie Resource Leak**. Orphaned `gs` processes consume RAM until manually killed.
- **Job Status**: BullMQ "Stalled" mechanism eventually moves the job back to `waiting`.
- **State Recovery**: ✅ **SUCCESS**. BullMQ handles the retry, but the zombie processes may lead to eventual OOM on the host.

### 💀 Scenario: "Redis Memory Exhaustion"
- **Action**: Fill Redis until `maxmemory` is reached.
- **System Behavior**: Redis returns `OOM command not allowed`.
- **Outcome**: 🛑 **System Freeze**. New job submission is impossible. `bullmq` fails to move jobs to the `active` state.
- **Resilience**: 🛑 **FAIL**. No dead-letter-queue (DLQ) or fallback to filesystem-based queuing exists.

## Structural Findings
1. **Lack of Orphan Cleanup**: The worker does not use `tree-kill` or a "Death Pact" (killing children when the parent dies).
2.  **Transaction Gaps**: Many operations (Upload -> WAF -> Enqueue -> DB Update) are not wrapped in a single transaction. A crash between these steps leaves orphaned files or "Phantom Jobs" in the database.

## Remediation Plan
1. **P0: Implement Process Death Pact**: Use a signal handler to ensure all child (Ghostscript) processes are killed if the worker receives `SIGTERM` or crashes.
2. **P1: Job Heartbeat**: Use the `bullmq` heartbeat to detect hung Ghostscript processes earlier.
3. **P2: Distributed Locking**: Use Redlock to ensure that a re-tried job doesn't try to process a file that is still locked by a zombie process.
