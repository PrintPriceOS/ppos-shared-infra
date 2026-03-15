# Deployment Pipeline Audit

## Overview
This report evaluates the containerization strategy and orchestration mechanisms for the PrintPrice OS platform.

## Containerization Audit (Docker)

| Service | Dockerfile Status | Base Image | Security Health |
| :--- | :--- | :--- | :--- |
| `ppos-preflight-engine` | ✅ Valid | `node:20-bookworm-slim` | Uses non-root user (`ppos-user`). |
| `ppos-preflight-worker` | ✅ Valid | `node:20-slim` | Simple but effective. |
| `PrintPricePro_Preflight-master` | ✅ Valid | `node:22-slim` | Multi-stage build; uses non-root user (`pppuser`). |
| `ppos-shared-infra` | ✅ Valid (Compose) | N/A | Orchestrates MySQL, Redis, and Temporal. |

## Orchestration (Docker Compose)
The primary orchestration file is located in `ppos-shared-infra/docker/docker-compose.yml`.

**Findings:**
- **Infrastructure Scope**: Covers MySQL (8.0), Temporal, RabbitMQ (3-management), Redis (7-alpine), and OpenTelemetry.
- **Service Gap**: The actual application services (Preflight Service, Control Plane) are NOT included in the main `docker-compose.yml`. They must be started manually or through another script.
- **Port Mapping**: Uses standard ports (`3306`, `6379`, `7233`). This is good for development but requires conflict management on shared servers.

## Build & Startup Scripts

| Script | Purpose | Finding |
| :--- | :--- | :--- |
| `bootstrap-repos.ps1` | Repo initialization. | Initializes git and commits initial state. Does not install dependencies. |
| `link-remotes.ps1` | Git orchestration. | Configures upstream remotes. |
| `create-dirs.js` | Filesystem prep. | Ensures required folders exist in legacy mono-repo. |

## Deployment Blockers
1. **Missing Orchestration for Services**: There is no "master" `docker-compose.yml` that starts the infrastructure AND the services together.
2. **Dependency Boot Order**: The services depend on MySQL and Redis being ready, but no health checks are currently defined in the `docker-compose.yml` to ensure order of execution.
3. **Ghostscript Binary**: While containerized in the engine, the legacy app `server.js` checks for dependencies locally if not strictly running in delegated mode.

## Remediation Plan
1. **Create a Master `docker-compose.yml`**: Combine infrastructure and services into a single orchestration file.
2. **Implement `depends_on` with `healthcheck`**: Ensure MySQL and Redis are fully initialized before services attempt to connect.
3. **Automate Build Chain**: Add a `build-all.sh/ps1` script to run `npm install` and `npm run build` across all repositories in the correct order (`contracts` -> `infra` -> `engine` -> `services`).
