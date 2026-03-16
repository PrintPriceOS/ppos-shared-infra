# Error Serialization Hardening — PrintPrice OS

## 1. Scope
Ensures that all error objects emitted by the `ppos-preflight-worker` are stripped of regional or developer-specific information before being logged or persisted.

## 2. Hardening Logic: `sanitizeError`
Implemented in `workerSanitizer.js`, the logic enforces:
- **Automatic Path Redaction**: Regex-based detection of both Windows and Nix absolute paths.
- **Stack Trace Removal**: Prevents long, internal path-laden stack traces from leaking into audit logs.
- **Contextual Transparency**: Preserves `code`, `failure_category`, and `region_id` for valid debugging.

## 3. Transformation Example
### Raw Input
```text
Error: Ghostscript failed at C:\Users\KIKE\Desktop\ppos\temp\job_1.pdf
```
### Sanitized Output
```json
{
  "code": "WORKER_RUNTIME_ERROR",
  "message": "Ghostscript failed at [REDACTED_LOCAL_PATH]",
  "failure_category": "general",
  "region_id": "DEV-LOCAL",
  "sanitized": true
}
```

## 4. Integration Point
The hardening is applied at the entry of every `catch` block in `PreflightWorker.processJob`, ensuring no un-sanitized error message ever reaches a `console.error` or SQL query.
