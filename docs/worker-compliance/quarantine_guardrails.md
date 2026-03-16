# Quarantine Guardrails — PrintPrice OS

## 1. Overview
Quarantined assets in PrintPrice OS often trigger failures that include highly sensitive local filesystem metadata. These guardrails ensure that quarantine reports are metadata-centric and path-safe.

## 2. Sanitization Strategy
When a job is marked for quarantine (via `RetryManager`), the `WorkerSanitizer.sanitizeQuarantineMetadata` method is invoked to strip:
- **`asset_path`**: The local source location.
- **`output_path`**: The destination in the worker's storage.
- **`quarantine_path`**: The physical location inside the local `.runtime/quarantine/`.

## 3. Standardized Quarantine Record
| Field | Inclusion | Reason |
| :--- | :--- | :--- |
| `job_id` | ✅ Yes | Unique reference. |
| `region_id` | ✅ Yes | Regional ownership. |
| `quarantine_label` | ✅ Yes | E.g., `input_poison`. |
| `file_hash` | ✅ Yes | Deterministic ID of the bad asset. |
| `file_size` | ✅ Yes | Informational. |

## 4. Operational Guardrail
Any persistence of quarantine state in the `governance_audit` table is restricted to the sanitized metadata. Regional operators can still access the physical files locally using the `job_id`, but global dashboards never see the underlying paths.
