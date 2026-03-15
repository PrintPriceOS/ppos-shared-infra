# Shared Guardrail Integration — PrintPrice OS

## 1. Overview
To ensure consistency across the entire multi-region ecosystem, core sanitization logic has been factored out of the worker and into the `ppos-shared-infra` package.

## 2. Shared Components
| Module | Location | Purpose |
| :--- | :--- | :--- |
| **`sanitizationUtils`**| `ppos-shared-infra/packages/region/sanitizationUtils.js` | Contains universal regex for path redaction. |
| **`redactPaths`** | `ppos-shared-infra/index.js` (Exported) | Canonical function for cleaning strings. |

## 3. Implementation Details
The `redactPaths` function uses predefined tokens to replace sensitive metadata:
- `[REDACTED_LOCAL_PATH]`
- `[REDACTED_SYSTEM_PATH]`
- `[REDACTED_TEMP_PATH]`

## 4. Reusability
This refactor allows the following services to use the same logic in the future:
- **Control Plane**: Cleaning UI-bound metadata.
- **FSS Transport**: Final safety check before cross-region relay.
- **Gateway**: Sanitizing error responses for edge clients.
