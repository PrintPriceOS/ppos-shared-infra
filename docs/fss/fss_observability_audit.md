# FSS Observability & Audit — PrintPrice OS

## 1. Distribution Metrics (SLAs)

| Metric | Target | Description |
| :--- | :--- | :--- |
| **Global Replication Lag** | < 2s (P95) | Time for a policy published in EU to reach APAC. |
| **Sync Success Rate** | > 99.99% | Ratio of successfully verified signatures. |
| **Replay Backlog Size** | < 1000 items | Number of events waiting for regional reconnection. |
| **Conflict Rate** | < 0.1% | Events requiring LWW or Authority resolution. |

## 2. Integrated Auditing
All FSS events are immutable and archived in the **Global Audit Registry**.

### Audit Fields
- `who`: Regional ID + Node ID.
- `what`: Event Type + Entity ID + Payload Hash.
- `when`: Event Timestamp + Arrival Timestamp.
- `proof`: Digital Signature + Genesis Reference.

## 3. Alerts & Anomaly Detection
The FSS monitor (in `ppos-control-plane`) triggers alerts for:
- **`SIGNATURE_VALIDATION_FAILED`**: Potential MITM or regional key compromise.
- **`REGION_ISOLATED`**: Region missed more than 5 consecutive heartbeats.
- **`STALE_POLICY_DETECTED`**: A worker is executing jobs using a policy hash that has been superseded globally.

## 4. Operational Dashboard
The PPOS Control Plane - **FSS Tab** provides:
1. **Global Health Map**: Visual status of all regional hubs and lag metrics.
2. **Replay Queue Status**: Visibility into buffered events during partitions.
3. **Conflict Log**: Detailed breakdown of automated resolution decisions.
