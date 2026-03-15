# Red Team Report: Security Attack Surface

## Audit Objective
Expose hidden security vulnerabilities, credential leaks, and insecure data handling in the PrintPrice OS platform.

## Security Critical Vulnerabilities

### 🔓 Vulnerability S1: "The Master Key" (Hardcoded Secrets)
- **Credential**: `ADMIN_API_KEY="my-secret-admin-key"`
- **Severity**: 🔴 **CRITICAL**.
- **Location**: Found in the default `.env` template and the active server `.env`.
- **Risk**: Any attacker gaining access to the codebase instantly knows the "Master Key" to the administration dashboards and kill-switches.

### 🔓 Vulnerability S2: "The Database Leash" (Plaintext Connection Strings)
- **Credential**: `DATABASE_URL="mysql://Kike:L8YwOuq0i4$v&dql@localhost:3306/preflight_"`
- **Severity**: 🔴 **CRITICAL**.
- **Found**: In active root `.env`.
- **Risk**: Hardcoded passwords for system users.

### 🔓 Vulnerability S3: "Admin Bypass" (Feature Flag Reliance)
- **Observation**: `App.tsx` uses `VITE_FEATURE_ADMIN` to show/hide the admin cockpit.
- **Risk**: A frontend-only toggle is not a security measure. Any user can set this flag in their browser console or inspect the bundle to find the `/api/admin` endpoints.
- **Backend Check**: `server.js` previously had `requireAdmin` middleware, but it was noted as **REMOVED** on line 83 and 277.
- **Severity**: 🔴 **CRITICAL**. Admin endpoints appear to be exposed or rely only on the presence of a header (`x-admin-api-key`) with a **hardcoded secret** (S1).

### 🔓 Vulnerability S4: "File Disclosure" (Static Asset Leak)
- **Observation**: `server.js` serves `dist` statically with `nosniff`.
- **Risk**: If `.env` or sensitive JSON files are accidentally placed in `dist` during build, they are served to the public.

## Attack Surface Analysis
- **Unauthenticated Probes**: The `/health`, `/ready`, and `/api/ready` endpoints return detailed system metrics (Node version, memory usage, DB status) without authentication. This aids in "Footprinting" the target.
- **WAF Bypass**: The `pdfUploadWaf` is a "Fast Heuristic" check. While good for performance, a "Morphic PDF" (changing its structure after 2MB) could easily skip the token scan.

## Remediation Plan
1. **P0: ROTATE and REDACT**: Immediately change the DB password and the Admin API Key. Remove them from `.env` and use a Secret Manager or `.env.local` that is NEVER committed.
2. **P0: RE-IMPLEMENT RBAC**: Restore the `requireAdmin` middleware. Admin actions must require a signed JWT with `role: admin`, not just a static header key.
3. **P1: Secure Health Checks**: Strip sensitive info from public `/health` endpoints. Require a token for "Full Diagnostic" data.
4. **P1: Deep WAF Scan**: For production, the WAF should have a "Deep Mode" that scans the entire file, not just the first 2MB, before passing it to the worker.
