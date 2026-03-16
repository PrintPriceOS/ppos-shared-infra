# PrintPrice OS — Quarry Cleanup Map (STATUS: COMPLETED)

Classification of files in `PrintPricePro_Preflight-master (7)` for decoupling and eventual removal.

| Path | Current Role | Canonical Owner | Category | Recommended Action | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Active Paths** | | | | | |
| `frontend/` | UI Components | Product Repo | A | **KEEP** | **ACTIVE** |
| `routes/apiV2.js` | Business API | Product Repo | A | **KEEP** | **ACTIVE** |
| `services/db.js` | Storage Layer | Product Repo | A | **KEEP** | **ACTIVE** |
| `services/tenantService.js` | Multi-tenancy | Product Repo | A | **KEEP** | **ACTIVE** |
| `services/pdfPipeline.js` | Core Orchestration | `ppos-preflight-service` | C | **ADAPTER** | **ACTIVE** |
| `services/queue.js` | Job Delegation | `ppos-preflight-service` | C | **ADAPTER** | **ACTIVE** |
| **Deleted Paths** | | | | | |
| `services/internal/` | Engine Logic | `ppos-preflight-engine` | B | **DELETE** | **DELETED** |
| `services/reportService.js` | Report Logic | `ppos-preflight-service` | B | **DELETE** | **DELETED** |
| `workers/` | Async Jobs | `ppos-preflight-worker` | B | **DELETE** | **DELETED** |
| `PrintPriceOS_Workspace/` | Materialized Repos | `PrintPriceOS` (Github) | D | **ARCHIVED/PRUNED** | **RECONCILED** |
| `runtime-test-workspace/` | Extraction Artifacts | None | D | **DELETE** | **DELETED** |

## Definition of Categories

- **Category A (KEEP)**: Core product value. Unique to the application.
- **Category B (DEPRECATED/DELETED)**: Logic moved to the OS. No longer the source of truth.
- **Category C (CONVERTED)**: Infrastructure bridges. Refactored to call OS services.
- **Category D (REMOVED)**: Temporary or redundant files from the materialization process.
