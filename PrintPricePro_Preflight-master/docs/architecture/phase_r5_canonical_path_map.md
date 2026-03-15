# Phase R5 — Canonical Path Map

Definitive mapping of legacy (bridged) paths to their final canonical locations within the PrintPrice OS ecosystem.

| Legacy Path | Canonical Location | Repository | Status |
| :--- | :--- | :--- | :--- |
| `./services/policyEngine` | `../../ppos-governance-assurance/src/policyEngine` | `ppos-governance-assurance` | `CUTOUT_PENDING` |
| `./kernel/index` | `../../ppos-core-platform/src/kernel/index` | `ppos-core-platform` | `DEAD_PATH_REMOVAL` |
| `./services/jobManager` | `../../ppos-core-platform/src/registry/jobManager` | `ppos-core-platform` | `DEAD_PATH_REMOVAL` |
| `./middleware/printerAuth` | `../../ppos-core-platform/src/middleware/printerAuth` | `ppos-core-platform` | `CUTOUT_PENDING` |
| `./routes/connect` | `../../ppos-control-plane/src/routes/connect` | `ppos-control-plane` | `CUTOUT_PENDING` |
| `./routes/reservations` | `../../ppos-core-platform/src/routes/reservations` | `ppos-core-platform` | `DEAD_PATH_REMOVAL` |

## Resolution Strategy
All future code must reference these services via the canonical repositories. The Product App is now strictly a user-facing consumer and should not house these files.
