# Implementation Plan: V1.9.2.a — Async Infrastructure Enablement

## 🎯 Objective
Enable and validate the asynchronous worker infrastructure by resolving environment blockers (Redis) and refining the worker's operational logic.

---

## 🏗 Phase Breakdown

### 1. Redis Availability (The "Async Heart")
- **Task**: Establish a stable Redis connection for the local staging environment.
- **Strategy**: 
    - Verify if a local Redis server can be started (e.g., `redis-server.exe` on Windows).
    - If Docker is available but permissions were the issue, attempt an unprivileged port map.
    - Validate connection: `node -e "const r=require('ioredis'); new r().ping().then(console.log).catch(console.error)"`.

### 2. Worker Logging & Dependency Cleanup
- **Task**: Fix the `pino-pretty` transport error that crashed the worker.
- **Action**:
    - Update `ppos-preflight-worker` to include `pino-pretty` in standard dependencies or modify `worker.js` to fallback gracefully.
    - Standardize the `LOG_LEVEL` for staging.

### 3. Async Proving Run (E2E)
- **Task**: Execute the deferred async scenarios from the V1.9.2 plan.
- **Scenarios**:
    - **Job Ingestion**: `POST /preflight/analyze` with `async=true`.
    - **Queue Monitoring**: Verify the job appears in the queue (Control Plane visibility).
    - **Worker Consumption**: Confirm the worker picks up and processes the job.
    - **Status Polling**: Use the returned `jobId` to poll `/preflight/status/:id`.

### 4. Resilience Validation
- **Task**: Test the "Staging Hardening" logic in the asynchronous path.
- **Checks**:
    - **Retry Flow**: Simulate a temporary engine failure (e.g., kill engine process) and observe BullMQ retries.
    - **Circuit Breaker**: Trigger consecutive failures to verify the worker pauses consumption.

---

## 📋 Success Criteria
- ✅ `ppos-preflight-worker` starts and stays alive with structured logs.
- ✅ Redis connection verified by service and worker.
- ✅ E2E Async flow completed (from POST to Status: COMPLETED).
- ✅ Failure retry logic observed and documented.

---

## 🚀 Execution strategy
1. **Fix Worker Code**: Resolve the logging crash and check internal BullMQ settings.
2. **Lift Infrastructure**: Target Redis specifically.
3. **Launch & Test**: Run the targeted async test suite.
