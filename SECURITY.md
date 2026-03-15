# Security Policy — PrintPrice OS

## Security Philosophy

PrintPrice OS is designed as high-integrity industrial software. We prioritize security at the architectural level through:
- **Environment Isolation**: No absolute paths or leaking workspace details.
- **Secret Hardening**: Unified secret resolution with no hardcoded credentials.
- **Governance Gates**: Mandatory policy evaluation for all critical operations.

## Vulnerability Reporting

If you find a security vulnerability, please do NOT create a public issue. Instead, report it to the security team following these steps:

1. Send an email to `security@printprice.os` (encryption recommended).
2. Include a detailed description of the vulnerability and steps to reproduce.
3. Allow up to 48 hours for an initial response.

## Secret Management

All secrets must be managed through:
1. **Docker Secrets** (Production Preferred)
2. **Environment Variables** (via `SECRET_` prefix for hardening)

Never commit `.env` files or certificates to the repository.

## Audit Logging

All security-relevant actions are logged to the `governance_audit` table. This includes:
- API Key creation/revocation.
- Policy enforcement bypass attempts.
- Critical job failures.
