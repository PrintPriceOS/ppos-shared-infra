# Emergency Local Restrictions — PrintPrice OS

## 1. Safety Mandate
When a region loses contact with the global authority, it must prioritize system safety over throughput. Local overrides are only permitted if they are **Restrictive** in nature.

## 2. Permitted Local Overrides (RESTRICTION ONLY)
| Target | Allowed Restriction | Forbidden Elevation |
| :--- | :--- | :--- |
| **Printers** | Pause/De-register printer. | Onboard new printer. |
| **Auth** | Force logout/Revoke token. | Grant new permissions. |
| **Jobs** | Block job class (e.g., AI-heavy). | Increase job priority. |
| **Quotas** | Reduce tenant quota locally. | Increase tenant quota. |

## 3. Emergency Mode logic
The `EmergencyRestrictionManager` activates a local safety overlay:
```javascript
function enforceEmergency(decision) {
    if (decision.allow && localRiskHigh()) {
        decision.allow = false;
        decision.reason = "EMERGENCY_LOCAL_RESTRICTION";
    }
    return decision;
}
```

## 4. Forced Auditability
Every emergency override must trigger an `EMERGENCY_OVERRIDE_EVENT` in the local outbox. When the connection to the hub returns, the hub audits these overrides to ensure they were strictly restrictive.
