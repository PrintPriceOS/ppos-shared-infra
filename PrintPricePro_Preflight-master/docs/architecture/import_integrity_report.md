# Phase R6 — Import Integrity Scan

## 1. Forbidden Legacy Imports
The following legacy paths were scanned across the Product App.

| Path Pattern | Status | Remediation |
| :--- | :--- | :--- |
| `require('../services/policyEngine')` | [x] GONE | Replaced with `../../ppos-governance-assurance/src/policyEngine` |
| `require('../services/jobManager')` | [x] GONE | Delegated to OS Runtime |
| `require('../kernel')` | [x] GONE | Replaced with `@ppos/core-platform` |
| `require('../routes/reservations')` | [x] GONE | Moved to Core Platform |
| `require('../middleware/printerAuth')` | [x] GONE | Replaced with `../ppos-core-platform/src/middleware/printerAuth` |

## 2. Leakage Audit
*   **Shadow Imports**: None found.
*   **Relative Path Leaks**: All cross-repo imports use consistent `../` or `../../` patterns referencing the canonical `ppos-*` workspace. No imports "leak" into deleted monolith directories.
*   **Module Resolution**: Product App successfully resolves sibling repositories via relative paths.

## 3. Findings
*   **Summary**: All imports are clean. The Product App is now strictly referencing external canonical sources for platform logic.
