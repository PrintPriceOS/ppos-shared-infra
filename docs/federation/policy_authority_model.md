# Policy Authority Model — PrintPrice OS

## 1. Overview
The Policy Authority Model defines the hierarchy of trust and decision-making for governance policies across the PrintPrice OS federation. It ensures that while regions operate with local autonomy, they all follow a single, coherent global governance standard.

## 2. Authority Modes

| Mode | Authority Level | Description |
| :--- | :--- | :--- |
| **GLOBAL_HUB** | Full | The primary region authorized to publish global policies (e.g., `EU-PPOS-1`). |
| **DELEGATED_HUB** | Partial | A secondary region granted authority for a specific set of policy namespaces (e.g., Regional Tax rules). |
| **READ_ONLY_NODE** | None | Consumes and executes policies but cannot publish or modify global state. |
| **EMERGENCY_ISOLATE**| Local | Status triggered during partition where the region only accepts restrictive local overrides. |

## 3. The Authority Record
To verify authority, the platform uses a signed **PolicyAuthorityRecord**:
```json
{
  "authority_region": "EU-PPOS-1",
  "authority_mode": "GLOBAL_HUB",
  "key_id": "eu-pub-2026-03",
  "issued_at": "2026-03-15T12:00:00Z",
  "expires_at": "2026-06-15T12:00:00Z",
  "allowed_namespaces": ["*"]
}
```

## 4. Governance Invariants
1. **Single Global Source**: At any point in time, only one region serves as the `GLOBAL_HUB` for a given namespace.
2. **Deny-by-Default Elevation**: Any policy not signed by the authoritative key for its namespace is rejected.
3. **No Permissive Overrides**: Regional nodes can never broaden permissions defined in the global policy.
