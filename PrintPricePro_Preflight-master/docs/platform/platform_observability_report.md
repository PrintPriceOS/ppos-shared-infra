# Platform Observability Report — PrintPrice OS

## 1. Monitoring & Visibility Coverage

| Visibility Layer | Service Provider | Data Points |
| :--- | :--- | :--- |
| **Execution Health** | `metricsService` | Throughput, Error Rates, Latency. |
| **Control Pulse** | `ppos-control-plane` | Printer Node heartbeats, Registry status. |
| **Governance Audit**| `governance_audit` (DB) | Policy decisions, Admin overrides. |
| **Resource Flux** | `resourceGovernanceService` | Queue depths, Worker concurrency. |

## 2. Integrated Observability APIs
The following telemetry endpoints are now ACTIVE:
- `GET /api/metrics/overview`: Real-time platform throughput.
- `GET /api/metrics/governance`: Analysis of policy violations and rejections.
- `GET /api/federation/health/overview`: Printer network availability.

## 3. Logs & Event Tracing
- **Distributed Tracing**: `traceId` is propagated from the Product App through the Worker and into the Engine logs.
- **Fail-Fast Logs**: Critical errors in cross-repo dependencies (e.g., missing policies) are immediately trapped and sent to the Control Plane audit log.

## 4. Status
**Observability is ACTIVATED.** Operators can now monitor the entire lifecycle of a job from ingress to production offer.
