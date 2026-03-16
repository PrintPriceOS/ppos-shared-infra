# Hidden Production Fixes Report

## Overview
This report identifies manual interventions and "server-side only" configuration fixes that were required during the initial deployment but are not yet fully integrated into the repository as automated scripts or container configurations.

## Detected Manual Fixes

| Fix Name | Category | Production File | Impact |
| :--- | :--- | :--- | :--- |
| **Nginx MIME Type Fix** | Infrastructure | `/etc/nginx/mime.types` | Required for `.mjs` files to be recognized as Javascript by modern browsers. |
| **Increased Proxy Timeouts**| Configuration | `/etc/nginx/sites-enabled/*` | Critical for PDF processing (Ghostscript) which can exceed the default 60s Nginx timeout. |
| **Client Body Size** | Configuration | `nginx.conf` | Default `1M` size rejects large PDF uploads (up to 500MB required). |
| **Plesk Specific Redirects** | Routing | Plesk Nginx Directives | Necessary for SPA fallback routing (e.g., `/admin`) on shared hosting. |
| **Manual ICC Profiles** | Data/Assets | `/app/icc-profiles/` | Color profiles for PDF verification were manually uploaded to the server instead of being in the repo. |

## Undocumented System Packages
The following binaries were installed manually on the production server but are missing from some build manifests:
1. **Ghostscript (GS)**: Required for engine execution.
2. **Procps**: Required for process tracking and cleanup.
3. **Libvips / Sharp dependencies**: Some image processing logic depends on system-level libraries.

## Manual Directory Structures
The following paths must exist on the server for the application to boot:
- `/tmp/ppp-preflight` (Workdir)
- `/app/uploads-v2-temp` (Temporary storage)
- `/app/profiles` (Industry standard PDF profiles)

## Documentation vs. Automation
The repository contains `NGINX_FIX.md` and `PROD_CONFIG.md`. While these provide excellent documentation, they represent **manual overhead** for every new deployment. These should be moved to:
- A dedicated `nginx/nginx.conf` in the repo.
- A `docker-compose.yml` that includes an Nginx container.

## Remediation Plan
1. **Dockerize Nginx**: Include a pre-configured Nginx container in the `ppos-shared-infra` orchestration to eliminate manual proxy setup.
2. **Include ICC Profiles**: Commit baseline industry-standard ICC profiles to `ppos-governance-assurance`.
3. **Automate System Checks**: Update `services/dependencyChecker.js` to verify GS version and MIME type support on boot.
