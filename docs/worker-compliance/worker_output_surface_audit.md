# Worker Output Surface Audit — PrintPrice OS

## 1. Executive Summary
This audit identifies all data egress points in the `ppos-preflight-worker` where local runtime metadata, absolute paths, or sensitive assets could potentially leak into external systems (Audit DB, Logs, Control Plane).

## 2. Identified Output Surfaces

| Surface ID | Location | Data Type | Risk Level | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **OS-01** | `console.*` logs | Runtime diagnostic messages | **MEDIUM** | Redact absolute paths and stack traces using `LogSanitizer`. |
| **OS-02** | `logFailureAudit` | `governance_audit` payload | **HIGH** | Sanitize failure messages and strategy objects before SQL insertion. |
| **OS-03** | Job Result returns | Engine execution results | **MEDIUM** | Redact output paths and internal process metadata before returning to BullMQ. |
| **OS-04** | Error Handlers | `err.message`, `err.stack` | **HIGH** | Implement `ErrorSanitizer` to wrap engine failures with regional safe messages. |
| **OS-05** | Quarantine Metadata | Retention strategy objects | **MEDIUM** | Standardize quarantine labels to exclude local path references. |
| **OS-06** | Subprocess Stderr | Captured output from GS/Engine | **HIGH** | Scan and redact captured stderr buffers before logging or persisting. |

## 3. Vulnerability Analysis: Path Leakage
- **Windows Paths**: `C:\Users\KIKE\Desktop\...` detected in current dev environment.
- **Temp Paths**: `/tmp/ppos-preflight/...` or `os.tmpdir()` references.
- **Node Stack Traces**: Reveal internal monorepo structure (e.g., `.../ppos-preflight-engine/src/...`).

## 4. Compliance Categorization
- **SAFE**: `job_id`, `tenant_id`, `region_id`, `failure_class`, `latency`.
- **UNSAFE**: `asset_path`, `output_path`, `stderr`, `stack`, `local_path`.
- **REDACT**: `message` (if it contains paths), `strategy` (if it contains path-based instructions).

## 5. Required Actions
1. Implement `workerSanitizer.js` in the worker package.
2. Hook `logFailureAudit` to use the sanitizer.
3. Update global error handling in `processJob` to redact `err.message`.
4. Standardize quarantine reporting to metadata-only format.
