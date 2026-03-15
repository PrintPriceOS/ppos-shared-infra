# Log Redaction Strategy — PrintPrice OS

## 1. Goal
Retain the diagnostic value of worker logs while eliminating the risk of data leakage during log aggregation.

## 2. Redaction Mechanics
Worker logs captured via `console.error` and `console.log` are passed through the `workerSanitizer` when they contain failure data.

### Targeted Data Points
- **System Paths**: `/tmp/...`, `/var/lib/mysql/...`.
- **Developer Paths**: `C:\Users\...`, `D:\Projects\...`.
- **Binary Metadata**: References to raw byte streams or un-sanitized PDF properties.

## 3. Redaction Patterns
- **Regex Guard 1 (Win)**: `[A-Z]:\\[^ "]+` -> `[REDACTED_LOCAL_PATH]`.
- **Regex Guard 2 (Nix)**: `\/[^ "]*\/ppos-[^ "]+` -> `[REDACTED_SYSTEM_PATH]`.
- **Regex Guard 3 (Temp)**: `\/tmp\/[^ "]+` -> `[REDACTED_TEMP_PATH]`.

## 4. Preservation Policy
To maintain operational clarity, the following fields are **NEVER** redacted:
- `job_id`
- `region_id`
- `failure_class` (e.g., `TRANSIENT`, `INPUT_INVALID`)
- `tenant_id`
- `latency_ms`

This ensures that SREs can still correlate failures across the stack without knowing the physical details of the regional worker's filesystem.
