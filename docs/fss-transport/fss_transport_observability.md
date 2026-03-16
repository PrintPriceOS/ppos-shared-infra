# FSS Transport Observability — PrintPrice OS

## 1. Metrics Framework
The `OutboxRelay` and `RegionalReplicationReceiver` expose internal counters to the regional `MetricsService`:
- `fss_relay_sent_total`: Count of events successfully pushed to peers.
- `fss_relay_failed_total`: Count of transient delivery failures.
- `fss_receive_accepted_total`: Validated events written to inbox.
- `fss_receive_quarantined_total`: Events failing signature or trust checks.

## 2. Structured Audit Logs
Every transport action is logged with high-fidelity attributes:
```json
{
  "timestamp": "2026-03-15T12:00:00Z",
  "event_id": "evt-001",
  "origin": "EU-PPOS-1",
  "action": "TRANSPORT_ACCEPTED",
  "signature_status": "VALID",
  "relay_latency_ms": 120
}
```

## 3. Replication Lag Monitoring
By comparing the latest `event_id` timestamp in the **Local Outbox** with the latest applied timestamp in the **Remote Inbox**, operators can measure the **Global Synchronization Lag**.

## 4. Health Dashboard Integration
The Control Plane's Federation Cockpit displays real-time relay status, alerting operators if the `fss-outbox` backlog exceeds 1,000 events or if the relay heartbeat fails.
