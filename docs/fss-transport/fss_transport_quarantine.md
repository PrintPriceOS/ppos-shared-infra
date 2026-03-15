# Quarantine & Failure Handling — PrintPrice OS

## 1. Security Gate Failures
When an incoming FSS event fails validation, it is immediately diverted to the **Regional Quarantine Store** (`.runtime/fss-quarantine/`).

### Triggers for Quarantine
- **`INVALID_SIGNATURE`**: Signature doesn't match the payload.
- **`UNKNOWN_ORIGIN`**: `region_id` not found in the trust registry.
- **`TIMESTAMP_SKEW`**: Event is too old or from the future.
- **`UNAUTHORIZED_CAPABILITY`**: Region attempted to publish an event type it doesn't own (e.g., unauthorized policy update).

## 2. Quarantine Report Structure
Each quarantined event generates a report:
```json
{
  "quarantine_reason": "INVALID_SIGNATURE",
  "quarantined_at": "...",
  "envelope": { ... raw data ... }
}
```

## 3. Recovery Procedures
1. **Manual Audit**: Operator inspects the quarantine file.
2. **Key Rotation**: If failure was due to an expired key, update the trust registry.
3. **Selective Replay**: Once fixed, events can be manually moved from quarantine to the inbox for retry.

## 4. Protection Against Replay Storms
The receiver limits the rate of incoming events per region ID. If a storm is detected, subsequent events are rejected at the edge (HTTP level) to prevent resource exhaustion of the regional control plane.
