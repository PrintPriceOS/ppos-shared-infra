# Service Integration Audit

## Overview
This report maps the inter-dependencies between PrintPrice OS services and evaluates the robustness of their integration mechanisms.

## Integration Map

| Source Service | Target Service | Method | Findings |
| :--- | :--- | :--- | :--- |
| `PrintPricePro_Preflight-master` | `ppos-control-plane` | Direct Import | **High Risk**: Uses `../ppos-control-plane/src/...` relative imports. |
| `PrintPricePro_Preflight-master` | `ppos-preflight-service` | API Proxy | Routes `/api/v2/preflight` to the PPOS engine. |
| `ppos-preflight-service` | `ppos-preflight-engine` | Local Package | Uses `file:../ppos-preflight-engine` in `package.json`. |
| `ppos-preflight-worker` | `ppos-preflight-engine` | Local Package | Delegates execution to the engine kernel. |
| `ppos-control-plane` | `ppos-core-platform` | Direct Import | Shared logic for governance and printer selection. |

## Contract Integrity
- **Shared Contracts**: `ppos-shared-contracts` contains schemas and types.
- **Contract Drift**: Services like `PrintPricePro_Preflight-master` have their own `types.ts` that may drift from `ppos-shared-contracts`.
- **API Mismatches**: The legacy app still expects some V1 endpoints that might not be fully implemented in the new decoupled services.

## Critical Risks
1. **Relative Path Imports**: Direct cross-repository imports (`require('../ppos-...')`) make services impossible to deploy as separate containers without "leaking" the entire source tree into each image.
2. **Missing Service Discovery**: Services have hardcoded URLs (e.g., `localhost:3001`). There is no registry or service discovery mechanism (Consul/Etcd) in use.
3. **Queue Coupling**: `ppos-preflight-worker` and `ppos-preflight-service` are coupled via a shared Redis instance. If Redis is down, the entire processing pipeline fails with no fallback.

## Remediation Plan
1. **Promote to NPM Packages**: Convert shared modules (contracts, core, engine) into workspace packages or private NPM modules to replace `file:..` and relative imports.
2. **Implement API Gateway**: Use a dedicated entry point (like Nginx or the `api-gateway` draft in bootstrap) to manage service routing via environment variables instead of hardcoded paths.
3. **Standardize Event Schemas**: Move all event and job definitions to `ppos-shared-contracts` to ensure producers and consumers always share the same data model.
