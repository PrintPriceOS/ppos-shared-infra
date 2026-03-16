# PrintPrice Product — OS Deployment Configuration

This document specifies the environment and configuration requirements for integrating the PrintPrice Product Application with the **PrintPrice OS (PPOS)** runtime.

## 1. Environment Variables

The following variables must be configured in the production `.env` file or the CI/CD environment.

| Variable | Description | Recommended (Production) | Default |
| :--- | :--- | :--- | :--- |
| `PPOS_PREFLIGHT_SERVICE_URL` | Base URL of the Preflight Service. | `https://preflight-service.ppos.internal` | `http://localhost:3000` |
| `PPOS_CONTROL_PLANE_URL` | Base URL of the Federation Control Plane. | `https://control-plane.ppos.internal` | `http://localhost:8080` |
| `PPOS_REQUEST_TIMEOUT_MS` | Timeout for standard API calls. | `30000` (30s) | `30000` |
| `PPOS_LONG_REQUEST_TIMEOUT_MS`| Timeout for heavy operations (Autofix). | `60000` (60s) | `60000` |
| `PPOS_ENABLE_ASYNC_PREFLIGHT` | Flag to force async worker execution. | `false` (Auto-negotiated by OS) | `false` |
| `PPOS_ENABLE_AUTOFIX` | Feature flag for the autofix UI/API. | `true` | `true` |
| `PPOS_API_KEY` | Authentication key for PPOS API. | `SECURE_GENERATED_UUID` | `null` |
| `PPOS_ENVIRONMENT` | Runtime environment identifier. | `production` | `development` |

## 2. Centralized Configuration Module

The configuration is managed via `config/ppos.js`. This module handles:
- Variable parsing and type casting.
- Routing constants.
- Validation of environment safety.

## 3. Error Policy

Adapters in `services/pdfPipeline.js` and `services/queue.js` implement the following error behavior:

- **Staging/Production**:
    - **Service Unavailable / Timeout**: Throws `PPOS_SERVICE_FAILURE` with 503/504 status.
    - **Invalid Response**: Throws `PPOS_SERVICE_FAILURE`.
    - **No Fallback**: In production, we do NOT fall back to local (deprecated) engine logic to prevent inconsistent results.

- **Development/Test**:
    - **Queue Fallback**: If `PPOS_ENVIRONMENT` is NOT `production`, the queue adapter will return a `LOCAL_PENDING` mock job ID if the service is unreachable, allowing for isolated frontend development.

## 4. Security

- All outgoing requests to PPOS include the `X-PPOS-API-KEY` header if `PPOS_API_KEY` is configured.
- Ensure the network path between the Product and the OS is secured (e.g., via VPC peering or MTLS).

## 5. Status
**READY_FOR_STAGING_CONFIGURATION**
