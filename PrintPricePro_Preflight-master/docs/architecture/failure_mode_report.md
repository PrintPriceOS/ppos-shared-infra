# Phase R6 — Failure Mode Simulation

## 1. Simulation Scenarios

| Failure Scenario | Observation | Isolation | Rating |
| :--- | :--- | :--- | :--- |
| **Governance Service Unavailable** | Server fails to boot (Static require dependency). | High | CRITICAL |
| **Control Plane Unreachable** | Connect routes return 404 or 500 on request. | Medium | WARNING |
| **Platform Invalid Schema** | UI may fail to render job details; backend logs error. | Medium | STABLE_FAIL |
| **Printer Auth Fails** | External printer requests rejected; Product App UI healthy. | Total | ISOLATED_FAIL |
| **Corrupted Job Payload** | Caught by platform-side schema validation (Contracts). | Total | SAFE_FAIL |

## 2. Resilience Evaluation
*   **Static Dependencies**: The direct workspace requires (`../ppos-...`) create a hard dependency on the presence of OS repositories. Recovery requires repository restoration.
*   **Runtime Handover**: HTTP-based handover (`services/queue.js`) has a development fallback to "Mock" status, preserving dev lifecycle if the PPOS server is offline.
*   **Fault Isolation**: Failures in printer communication do not impact the core preflight UI for end customers.

## 3. Findings
*   **Next Steps**: Implementation of **Circuit Breakers** (from `@ppos/shared-infra`) in `services/queue.js` is recommended for future production hardening.
