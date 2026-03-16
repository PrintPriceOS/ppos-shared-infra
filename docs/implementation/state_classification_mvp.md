# State Classification MVP — PrintPrice OS

## 1. Overview
Defines the replication rules for every entity in the system. Ensures that only safe, non-private data is eligible for synchronization.

## 2. Implementation
- **Location**: `ppos-shared-infra/packages/region/stateClassification.js`

## 3. Classifications
| Classification | Description | Typical Entities |
| :--- | :--- | :--- |
| **GLOBAL** | Replicated everywhere. | `organization`, `governance_policy`, `printer_node` |
| **REGIONAL** | Strictly localized. | `job_payload`, `uploaded_pdf`, `quarantine_asset` |
| **DERIVED** | Replicated with redaction. | `job_metadata`, `region_health_summary` |
| **EPHEMERAL** | Temporary, no sync. | `worker_heartbeat`, `metrics_buffer` |

## 4. Helper Functions
- `classifyEntity(type)`: Returns the enum.
- `isGloballyReplicable(type)`: Boolean check for sync eligibility.
- `isRegionRestricted(type)`: Boolean check for residency enforcement.
