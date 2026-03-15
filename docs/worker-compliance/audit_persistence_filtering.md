# Audit Persistence Filtering — PrintPrice OS

## 1. Compliance Mandate
Ensures that the `governance_audit` table (and any future persistent audit sinks) contains zero region-restricted data.

## 2. Implementation
The worker-level `logFailureAudit` method has been hardened to include a mandatory sanitization phase:
```javascript
const auditPayload = { tenantId, message: err.message, strategy, timestamp: ... };
const sanitizedAudit = workerSanitizer.sanitizeAuditPayload(auditPayload);
await db.query(...)
```

## 3. Filtering Rules
- **Message Redaction**: Invokes `redactPaths` on the failure message.
- **Payload Stripping**: Uses `RegionFilter.sanitizeForGlobalSync ('audit_event', ...)` to remove restricted keys like `local_path`, `secret`, or `customer_id`.
- **Strategy Redaction**: Ensures that any path-based hints in the retry strategy (e.g., `RETRY_ON_SPECIFIC_PATH`) are stripped before storage.

## 4. Operational Benefit
This allows for a **Global Audit View** in the Control Plane where operators can see failures across all regions without the risk of viewing sensitive local metadata or proprietary filesystem structures.
