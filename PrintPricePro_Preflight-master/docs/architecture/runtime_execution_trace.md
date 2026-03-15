# Phase R6 — Runtime Execution Trace

## 1. Primary Ingestion Flow (Analyze PDF)

**Path**: `POST /api/v2/preflight/analyze`

| Step | Component | repo | Note |
| :--- | :--- | :--- | :--- |
| **1. Entry** | `routes/preflightV2.js` | Product App | Route handler hit by client. |
| **2. Auth/Limit** | `pino-http`, `v2UploadLimiter` | Product App | Infrastructure middleware. |
| **3. Governance Gate** | `policyEnforcementService` | `@ppos/shared-infra` | Decision handled by shared platform logic. |
| **4. Ingestion** | `services/assetService` | Product App | Local binary buffering. |
| **5. Platform Handover** | `services/queue.js` | Product App | Job delegated via HTTP Bridge to `ppos-preflight-service`. |
| **6. Context** | `services/db.js` | Product App | Job status stored (Proxied to `@ppos/shared-infra` DB). |

## 2. Policy Evaluation Flow

**Path**: `GET /api/v2/preflight/policies/:slug`

| Step | Component | repo | Note |
| :--- | :--- | :--- | :--- |
| **1. Request** | `routes/preflightV2.js` | Product App | |
| **2. Engine Call** | `ppos-governance-assurance/src/policyEngine` | `ppos-governance-assurance` | **Canonical OS Repo Execution** |
| **3. Response** | JSON Payload | | Returns refined policy rules to the UI. |

## 3. Findings
*   **Separation Verification**: Zero execution loops remain where the Product App attempts to process PDF content or run preflight rules locally.
*   **Integration Points**: All handover points (Governance, Queue, DB) are correctly mapped to OS repositories or platform services.
