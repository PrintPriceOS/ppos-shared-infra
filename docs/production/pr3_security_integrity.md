# PR3 — Security Integrity Audit

## Goal
Guarantee platform cannot be compromised through configuration or API abuse.

## Status: PASSED (with Secret Management remediation)

| Surface | Status | Security Controls |
|---------|--------|-------------------|
| External API | ✅ | `apiKeyMiddleware` with constant-time comparison. |
| Infrastructure | ✅ | Non-root execution in Docker; separate DB/Redis identities. |
| Application Layer | ✅ | `helmet` (CSP, HSTS, XSS); `CORS` origin restriction. |
| File Uploads | ✅ | Early rejection (500MB cap); Ghostscript industrial isolation. |
| Secrets Management | ❌ | **FAIL**: Hardcoded credentials in `.env` (Dev mode). |

## Audit Details

### 1. Hardening & Headers
The `server.js` implementation applies aggressive security middleware:
- **Helmet Integration**: Enforces `X-Content-Type-Options: nosniff` and a strict `ContentSecurityPolicy`.
- **CORS Restricted**: Access is restricted to trusted origins (preflight.printprice.pro, etc.).
- **Response Timeout**: A 610s safety net is implemented to kill hung connections, preventing Slowloris-style attacks.

### 2. Authorization Mechanism
The system uses a two-tier authorization model:
- **API Key**: `x-ppp-api-key` required for all destructive or industrial operations.
- **Internal Tracing**: `x-request-id` is respected and logged via `pino-http` for auditable request trails.

### 3. File Security (PDF Bomb Mitigation)
Security against malformed PDF assets relies on three layers:
1. **Size Limit**: 500MB hard cap before processing.
2. **Process Timeout**: 30s limit for individual Ghostscript operations.
3. **Subprocess Isolation**: Heavy engine tasks are forked into ephemeral child processes, limiting the blast radius of a memory-exhaustion attack.

## Recommendations
- **IMMEDIATE**: Transition production secrets (DB password, Redis auth) from `.env` files to environment variables injected via Docker Secrets or a managed Secret Manager.
- **Malware Scanning**: Integrate ClamAV in the ingestion pipeline for industrial production environments.

## Certification
**PR3 Layer: CERTIFIED (Conditional on Secret Manager adoption)**
