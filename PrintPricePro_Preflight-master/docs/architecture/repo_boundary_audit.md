# Repository Boundary Audit — PrintPrice OS

## 1. Overview
The current workspace `PrintPricePro_Preflight-master` (Product App) contains multiple violations of the **Canonical Architecture**. Specifically, it hosts platform governance, federation runtime logic, and even nested copies of other standalone repositories.

## 2. Component Classification

| Folder / File / Service | Classification | Target Repo | Rationale |
| :--- | :--- | :--- | :--- |
| `kernel/` | `MOVE_TO_PPOS_CORE_PLATFORM` | `ppos-core-platform` | Contains platform-wide domain models and report assembly logic. |
| `policies/` | `MOVE_TO_PPOS_GOVERNANCE_ASSURANCE` | `ppos-governance-assurance` | Production guardrails and policy definitions. |
| `ppos-control-plane/` | `MOVE_TO_PPOS_CONTROL_PLANE` | `ppos-control-plane` (extract) | Nested repository. Must be a sibling, not a child. |
| `ppos-printer-agent/` | `MOVE_TO_PPOS_PRINTER_AGENT` | `ppos-printer-agent` (extract) | Nested repository. Federated agent logic. |
| `ppos-build-orchestrator/` | `MOVE_TO_PPOS_BUILD_ORCHESTRATOR` | `ppos-build-orchestrator` | Nested repository. CI/CD automation. |
| `services/policyEngine.js` | `MOVE_TO_PPOS_GOVERNANCE_ASSURANCE` | `ppos-governance-assurance` | Governance loop logic. |
| `services/registryAdapter.js` | `MOVE_TO_PPOS_CORE_PLATFORM` | `ppos-core-platform` | Federation Matchmaker connectivity. |
| `services/tenantService.js` | `MOVE_TO_PPOS_CORE_PLATFORM` | `ppos-core-platform` | Platform-level tenant management. |
| `services/queue.js` | `MOVE_TO_PPOS_SHARED_INFRA` | `ppos-shared-infra` | Shared Redis/Worker queue logic. |
| `services/db.js` | `MOVE_TO_PPOS_SHARED_INFRA` | `ppos-shared-infra` | Database connectivity should be a shared utility. |
| `routes/connect.js` | `MOVE_TO_PPOS_CONTROL_PLANE` | `ppos-control-plane` | Marketplace/Connect surface logic. |
| `routes/reservations.js` | `MOVE_TO_PPOS_CORE_PLATFORM` | `ppos-core-platform` | Federation reservation logic. |
| `workers/` | `MOVE_TO_PPOS_PREFLIGHT_WORKER` | `ppos-preflight-worker` | Execution runtime logic. |
| `icc-profiles/` | `MOVE_TO_PPOS_SHARED_INFRA` | `ppos-shared-infra` | Global assets used by multiple services. |
| `profiles/` | `MOVE_TO_PPOS_SHARED_INFRA` | `ppos-shared-infra` | Shared configuration profiles. |
| `antigravity/` | `INTEGRATION_WORKSPACE_ONLY` | - | Agentic AI logic for the local workspace. |
| `jobs/` | `INTEGRATION_WORKSPACE_ONLY` | - | Sample production files. |
| `output_workspace/` | `INTEGRATION_WORKSPACE_ONLY` | - | Local execution side-effects. |
| `sandbox/` | `INTEGRATION_WORKSPACE_ONLY` | - | Local experimentation area. |
| `registry.__mirror/` | `DELETE_LEGACY` | - | Stale mirror of registry seeds. |
| `components/` | `KEEP_IN_PRODUCT_APP` | `preflight-app` | React UI components. |
| `pages/` | `KEEP_IN_PRODUCT_APP` | `preflight-app` | Product-facing views. |
| `server.js` | `KEEP_IN_PRODUCT_APP` | `preflight-app` | Product BFF Server. |

## 3. High-Risk Violations
1. **Nesting of PPOS Repos**: `ppos-control-plane` and `ppos-printer-agent` living inside `PrintPricePro_Preflight-master` breaks git boundary and CI/CD isolation.
2. **Embedded Governance**: `policyEngine.js` in the Product App means the product governs itself, violating "Platform Governance" separation.
3. **Direct Database Coupling**: Most services in the product app talk directly to the database or shared Redis without going through a governed service or shared package.

## 4. Immediate Extraction Action Items
- [x] Move nested `ppos-*` folders to workspace root. (COMPLETED in Phase 24.B)
- [x] Decouple `server.js` from `policyEngine`. (COMPLETED in Phase R2.A)
- [x] Replace local file imports of `kernel` with `@ppos/shared-contracts` or `@ppos/core-platform`. (COMPLETED in Phase R2.B via Bridge)
- [x] Extract residual Federation & Reservation logic. (COMPLETED in Phase R4)
