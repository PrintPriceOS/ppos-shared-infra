# Platform Resilience Report — PrintPrice OS

## 1. Failure Modes & Recovery Execution

| Failure Event | Automated Response | System State |
| :--- | :--- | :--- |
| **Worker Crash** | Job re-visibility in BullMQ after lock timeout. | **RECOVERABLE** |
| **DB Timeout** | MySQL pool automatic reconnection. | **STABLE** |
| **Printer Node Offline** | Matchmaker filters out inactive nodes (Heartbeat expiry). | **ISOLATED** |
| **Policy Registry Missing**| Fallback to `OFFSET_CMYK_STRICT` default policy. | **DEGRADED_SAFE** |
| **AI Budget Over-run** | Automated transition to manual approval queue. | **SAFE_STOP** |

## 2. Resilience Components Verified
- **Circuit Breakers**: `circuitBreakerService` (from `@ppos/shared-infra`) correctly trips if the Preflight Engine or LLM API has sustained failures.
- **Lease Heartbeats**: Worker capacity leases expire if the worker hangs, preventing "Zombie Jobs" from blocking the system.
- **Atomic Operations**: Job status transitions use transactions (where supported by the DB proxy) to prevent inconsistent states.

## 3. Findings
*   The system exhibits **High Fault Isolation**. A failure in the Printer Network does not crash the Preflight Pipeline.
*   **Self-Healing**: Workers automatically restart their polling loop after transient network errors.
