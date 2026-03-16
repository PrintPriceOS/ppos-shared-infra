# Failover Observability & Audit — PrintPrice OS

## 1. Metrics Portfolio
| Metric | Dimension | Description |
| :--- | :--- | :--- |
| `gov_policy_freshness` | seconds | Time since the last authoritative policy sync. |
| `gov_region_mode` | enum | Current mode: NORMAL, DEGRADED, STALE. |
| `gov_cache_hit_ratio` | percent | Ratio of requests served from fresh cache vs expired. |
| `gov_emergency_count` | counter | Number of restrictive overrides applied locally. |
| `gov_revocation_lag` | ms | Time between revocation receipt and cache purge. |

## 2. Critical Audit Log Events
- **`AUTHORITY_CHANGED`**: Logged when the `GLOBAL_HUB` moves to a different region.
- **`REGION_ENTERED_DEGRADED_MODE`**: Logged when the heartbeats pause > 1800s.
- **`CACHE_PURGED_ON_REVOCATION`**: Audit proof that a compromised key was neutralized.
- **`CONFLICT_REJECTION_UNAUTHORIZED_PUBLISHER`**: Proof that a non-authorized region tried to publish policy.

## 3. Transparency Dashboard
The **Federation Cockpit** must clearly display a "Governance Health" traffic light:
- **GREEN**: All regions synced within 300s.
- **AMBER**: One or more regions in DEGRADED mode.
- **RED**: Global authority revoked or region ISOLATED.

## 4. Post-Mortem Evidence
Every simulation or real failover must generate a **Convergence Report** detailing how each region reached the current state and which events were replayed during recovery.
