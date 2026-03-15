# Worker Sanitizer Design — PrintPrice OS

## 1. Overview
The `WorkerSanitizer` is a dedicated middleware component for the `ppos-preflight-worker` designed to enforce **Regional Data Residency** at the runtime output level.

## 2. Shared Responsibility
- **`RegionFilter` (Shared)**: Provides base classification and generic redaction patterns.
- **`WorkerSanitizer` (Local)**: Implements worker-specific redaction for subprocess stderr, job metadata, and quarantine reporting.

## 3. Core Sanitzation Rules

### A. Path Redaction
- **Regex-based detection**: Identifies absolute Windows (`C:\...`) and Nix (`/tmp/...`, `/home/...`) paths.
- **Replacement**: Replaces sensitive strings with descriptive tokens like `[REDACTED_LOCAL_PATH]`.

### B. Error Hardening
- **Depth**: Sanitizes `message` and prevents `stack` from being persisted in external DBs.
- **Metadata**: Attaches `region_id` to every error blob for global audit coherence.

### C. Quarantine Strategy
- **Redaction**: Removes the `asset_path` and `output_path` from quarantine reports.
- **Exposure**: Only exposes the **Quarantine Label** (e.g., `input_poison`) and **Job ID**.

## 4. Operational hook
The sanitizer is invoked in:
1. `catch` blocks before `logFailureAudit`.
2. Response building before returning to the queue orchestrator.
3. Structured logging wrappers.
