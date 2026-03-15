# Canonical Repo Ownership Map — PrintPrice OS

## 1. Domain Ownership

| Domain | Responsible Repository | Description |
| :--- | :--- | :--- |
| **Product UI / BFF** | `preflight-app` | User-facing application and product routes. |
| **Governance** | `ppos-governance-assurance` | SLO monitoring, policy enforcement, resilience. |
| **Core Platform** | `ppos-core-platform` | Job orchestration, matchmaking, dispatch. |
| **Preflight Execution** | `ppos-preflight-worker` | Heavy compute, PDF inspection execution. |
| **Federation Agent** | `ppos-printer-agent` | Local connector for external printers. |
| **Operator Admin** | `ppos-control-plane` | Central cockpit for system operators. |
| **Shared Contracts** | `ppos-shared-contracts` | DTOs, Interfaces, Event schemas. |
| **Shared Infra** | `ppos-shared-infra` | Database, Redis, and logging utilities. |

## 2. Component Mapping

| Component | Current Location | Canonical Owner Repo |
| :--- | :--- | :--- |
| `kernel/**/*.js` | `PrintPricePro_Preflight-master/kernel/` | `ppos-core-platform` |
| `policyEngine.js` | `PrintPricePro_Preflight-master/services/` | `ppos-governance-assurance` |
| `registryAdapter.js` | `PrintPricePro_Preflight-master/services/` | `ppos-core-platform` |
| `printer-offers` API | `PrintPricePro_Preflight-master/routes/` | `ppos-control-plane` (or Core) |
| `connect` Routes | `PrintPricePro_Preflight-master/routes/connect.js` | `ppos-control-plane` |
| `reservations` logic | `PrintPricePro_Preflight-master/routes/reservations.js` | `ppos-core-platform` |
| ICC Profiles | `PrintPricePro_Preflight-master/icc-profiles/` | `ppos-shared-infra` |
| DB Connectivity | `PrintPricePro_Preflight-master/services/db.js` | `ppos-shared-infra` |
| Tenant Logic | `PrintPricePro_Preflight-master/services/tenantService.js` | `ppos-core-platform` |
