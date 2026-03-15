# FEP Error Model

## 1. Error Categories
FEP defines structured categories for faster resolution and policy mapping.

| Category | Code Prefix | Description |
| :--- | :--- | :--- |
| **Validation** | `VAL_` | Schema or data integrity issues. |
| **State** | `STE_` | Illegal lifecycle transitions. |
| **Governance** | `GOV_` | Policy violations or missing assertions. |
| **Trust** | `TRU_` | Trust thresholds not met. |
| **Compatibility**| `CMP_` | Version or profile mismatches. |
| **System** | `SYS_` | Internal processing errors. |

## 2. Canonical Error Codes
- `VAL_INVALID_SCHEMA`: Payload does not match JSON schema.
- `STE_TRANSITION_REJECTED`: State change not allowed for current state/actor.
- `GOV_POLICY_DENIED`: Action blocked by node's governance policy.
- `TRU_BELOW_THRESHOLD`: Reliability score too low for this action.
- `CMP_INCOMPATIBLE_VERSION`: Protocol version mismatch.
- `SYS_PROCESSING_TIMEOUT`: Node failed to respond within limits.

## 3. Error Event Structure
Errors MUST travel in a `protocol_error` message.

```json
{
  "errorId": "err_uuid",
  "errorCode": "GOV_POLICY_DENIED",
  "severity": "high",
  "targetEntity": "assignment_001",
  "message": "Assignment activation rejected: Missing mandatory compliance record.",
  "context": {
    "requiredPolicy": "partner_v1",
    "missingField": "governance.assertionId"
  }
}
```
