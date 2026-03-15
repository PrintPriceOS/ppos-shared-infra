# Integration Workspace Definition

## 1. Role
The directory `c:\Users\KIKE\Desktop\PrintPricePro_Preflight-master (7)\` acts as a **Local Integration Workspace**. It is NOT a monolith repository. Its purpose is to facilitate local development and end-to-end testing across the federated ecosystem.

## 2. Structure
The workspace follows a **Sibling Repository Pattern**:
- `PrintPricePro_Preflight-master/` (Canonical Product App)
- `ppos-control-plane/` (Canonical Operator UI/Service)
- `ppos-core-platform/` (Canonical Orchestrator)
- `ppos-governance-assurance/` (Canonical Governance)
- `ppos-shared-infra/` (Shared Utils)
- `ppos-shared-contracts/` (Shared Types)
- ... (other specialized services)

## 3. Tooling
- **Bootstrap**: `bootstrap-repos.ps1` initializes the workspace.
- **Linking**: `link-remotes.ps1` manages git upstreams.
- **Registry**: `printprice-os-bootstrap` seeds the machine registries for local development.

## 4. Constraint
Development in this workspace must respect the repo boundaries. Changes to the platform must be committed to the relevant `ppos-*` repo, even if tested within the Product App context.
