# Red Team Report: Data Integrity Attack

## Audit Objective
Attempt to corrupt the platform's state by injecting malformed assets, invalid job specifications, and broken PDF structures.

## Data Sabotage Scenarios

### 🧪 Scenario: "The PDF Zip Bomb"
- **Action**: Upload a small PDF (100KB) that decompresses into 1GB through deeply nested `/XObject` references.
- **Handling**: `pdfUploadWafCheck` does a fast heuristic check on object counts.
- **Result**: `tok.objCount` will catch some, but a "Late-Acting" bomb would pass.
- **Outcome**: 🛑 **Worker Crash (OOM)**. The `Ghostscript` process will attempt to allocate massive memory and be killed by the OS.
- **Resilience**: **MEDIUM**. Protected by the `SubprocessExecutor` memory limit (`2048MB`), but repeated attempts could saturate the worker pool.

### 🧪 Scenario: "Identity Spoofing" (Invalid Tenant ID)
- **Action**: Submit a job with `tenant_id: "; DROP TABLE jobs; --"`.
- **Handling**: The system uses `mysql2` placeholders (`?`).
- **Result**: ✅ **SECURE**. SQL injection is mitigated.
- **Outcome**: The job is created with a literal bad tenant name.

### 🧪 Scenario: "Malformed Job Specs"
- **Action**: Send a JSON to the `/analyze` endpoint with missing mandatory fields (e.g., no `minBleedMm`).
- **Handling**: `CommandHandler._resolveConfig` uses default fallbacks.
- **Result**: ✅ **ROBUST**. The system uses reasonable defaults.

## Validation Robustness
- **PDF Headers**: ✅ **Checks for %PDF-**.
- **MIME Types**: 🛑 **RELIANCE ON FILENAME**. The system often relies on `.pdf` extension rather than deep magic-byte inspection in all layers.
- **Schema Validation**: ⚠️ **FRAGMENTED**. Some endpoints use Joi/Zod, others rely on simple "if" checks.

## Remediation Plan
1. **P0: Strict Page/Size Limits**: Enforce `PDF_MAX_PAGES` and `PDF_MAX_SIZE` globally at the API Gateway level to prevent "Exploding PDF" attacks.
2. **P1: Magic Byte Enforcement**: Use the `file-type` library to verify the actual buffer content before writing to disk, ignoring the user-supplied extension.
3. **P2: Shared Schema Registry**: Move all Job/Offer definitions to `ppos-shared-contracts` and use a unified validation middleware in all services.
