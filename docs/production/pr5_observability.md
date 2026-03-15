# PR5 — Observability & Diagnostics Audit

## Goal
Ensure operators can understand the system state and diagnose issues in real time.

## Status: PASSED

| Facility | Implementation | Observations |
|----------|----------------|--------------|
| Structured Logging | `pino-http` | JSON logs with `reqId` tracing available in BFF. |
| Health Checks | `/api/ready` | Provides boot-time diagnostics, DB status, and dependency availability. |
| Metrics / SLOs | `SLOEvaluationService` | Tracks latency, success rates, and lease integrity via `governance_audit`. |
| Request Tracing | Header `x-request-id` | Propagated across the request lifecycle for correlation. |
| System Dashboard | Control Plane UI | Real-time visualization of queue depths and worker states. |

## Audit Details

### 1. Diagnostic Endpoints
The platform implements a multi-tier health model:
- **Liveness (`/health`)**: Basic "heartbeat" check for load balancers.
- **Readiness (`/api/ready`)**: Deep check that verifies:
  - Database connectivity.
  - Presence of Ghostscript binaries.
  - Manifest validity.
  - Presence of critical environment variables (e.g., `DATABASE_URL`).

### 2. Operational Metrics (SLO Layer)
The `SLOEvaluationService` translates raw data into business-relevant signals:
- **Time-to-Start**: Measures how long a job waits in queue before a worker picks it up (Target < 30s).
- **Lease Integrity**: Detects if workers are crashing frequently without releasing resources (Target > 99.9%).
- **Job Success Rate**: Aggregates successful vs failed executions across the cluster.

### 3. Log Hygiene
Logs are prefixed with industrial classification tags:
- `[BOOTSTRAP]`: Critical startup sequence events.
- `[GOVERNANCE-BLOCK]`: Policy enforcement denials.
- `[WORKER-CRITICAL]`: High-priority infrastructure failures.
All logs include timestamps and, where applicable, `tenantId` and `jobId`.

## Recommendations
- **Centralized Aggregation**: Configure `pino` to ship logs to a centralized provider (Elasticsearch/Splunk).
- **Prometheus Exporter**: Create a bridge service to export `SLOEvaluationService` results into Prometheus format for standard alerting.

## Certification
**PR5 Layer: CERTIFIED**
