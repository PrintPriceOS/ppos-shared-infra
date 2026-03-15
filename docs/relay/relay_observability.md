# Relay Observability
# PrintPrice OS — Federated Transport

The Federated State Sync (FSS) relay layer is fully instrumented to provide operators with real-time visibility into the health of regional synchronization.

## 1. Prometheus Metrics

The `MetricsService` has been extended with the following relay-specific metrics:

| Metric Name | Type | Labels | Description |
| :--- | :--- | :--- | :--- |
| `ppos_fss_outbox_pending_total` | Gauge | `region_id` | Number of events in outbox awaiting sweep. |
| `ppos_fss_relay_sent_total` | Counter | `region_id`, `destination` | Total events successfully pushed to a peer. |
| `ppos_fss_relay_failed_total` | Counter | `region_id`, `destination`, `reason` | Total push failures. |
| `ppos_fss_inbox_received_total` | Counter | `region_id`, `origin` | Total events received and verified in inbox. |
| `ppos_fss_security_violations_total` | Counter | `origin`, `violation_type` | Signature or authority failures. |

## 2. Structured Audit Logging

Relay events are logged in the `governance_audit` with the following taxonomy:

* **`FSS_RELAY_PUSH`**: Outbound transmission record.
* **`FSS_RELAY_RECEIVE`**: Inbound reception and verification record.
* **`FSS_RELAY_BLOCK`**: Rejection due to signature or authority.
* **`FSS_REPLAY_APPLY`**: Execution of a federated event side-effect.

## 3. Alerts

High-priority alerts for the Relay layer:

* **CRITICAL: `ppos_fss_security_violations_total > 0`**: Likely indicating a compromise attempt or key mismatch.
* **WARNING: `ppos_fss_relay_failed_total` increasing over 5m**: Network partition or peer outage.
* **STALE: `ppos_fss_outbox_pending_total > 100`**: Relay process is stuck or synchronous lag is too high.

## 4. Federated Health Exchange

Regions periodically publish their own `RegionHealthSummaryPublished` event containing their local sync lag and outbox depth, allowing a central cockpit to visualize the entire network's synchronization health.
