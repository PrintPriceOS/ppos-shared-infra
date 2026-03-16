# Federated Health Visibility Model

## Objective
Provide a real-time, aggregated view of regional convergence status for the Control Plane.

## Health States

| State | Meaning | Action Required |
| :--- | :--- | :--- |
| **HEALTHY** | Regional state is converged and current. | None. |
| **DEGRADED** | Replay lag detected or low-level quarantine active. | Monitor throughput. |
| **CRITICAL** | High quarantine backlog or persistent drift. | Immediate manual intervention. |
| **ISOLATED** | No communication with other regions. | Verify network partition. |

## Exposed Metrics
The `FederatedHealthService` exposes:
* `last_applied_version`: Convergence depth.
* `quarantine_backlog`: Count of isolated events.
* `replay_lag`: Distance from authoritative global state.
* `drift_domains`: List of domains currently being reconciled.
