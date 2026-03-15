# Runtime Dependency Report

## Overview
This report identifies and verifies all required runtime dependencies for the PrintPrice OS ecosystem, including system-level tools, databases, and language runtimes.

## Core Runtimes

| Tool | Required Version | Usage |
| :--- | :--- | :--- |
| **Node.js** | `^20.0.0` or `^22.0.0` | Primary runtime for all services, workers, and control plane. |
| **PNPM / NPM** | Latest stable | Package management. `ppos-build-orchestrator` uses PNPM. |

## External System Dependencies

| Dependency | Purpose | Verification Status |
| :--- | :--- | :--- |
| **Ghostscript** | PDF processing and rasterization. | ✅ Included in Engine/Worker Dockerfiles. |
| **Redis** | Queue management via `bullmq` and caching. | ⚠️ Required for queue resilience. |
| **MySQL** | Core registry, event ledger, and printer nodes database. | ⚠️ Schema initialization scripts found in `ppos-shared-infra`. |
| **Procps** | Process management in Linux containers. | ✅ Included in legacy app Dockerfile. |

## Key Software Libraries (Pinned)

| Library | Version | Usage |
| :--- | :--- | :--- |
| `ioredis` | `^5.4.1` | Redis client for caching and data storage. |
| `bullmq` | `^5.0.0` | Industrial-grade job queue management. |
| `pdf-lib` | `^1.17.1` | PDF manipulation and generation. |
| `pdfjs-dist` | `^4.0.0` | PDF parsing and data extraction. |
| `pino` | `^9.3.2` | High-performance JSON logging. |
| `mysql2` | `^3.11.0` | MySQL client for data persistence. |

## Missing or Under-documented Dependencies
1. **Queue Configuration**: While `bullmq` is present, the specific Redis connection parameters and queue concurrency settings vary across repositories.
2. **Database Versioning**: `mysql` scripts are present, but the specific MySQL version (e.g., 8.0) is not explicitly pinned in all deployment scripts.
3. **Ghostscript Binaries**: Local development on Windows requires manual installation of `gs.exe` which is not automated in the bootstrap scripts.

## Remediation Plan
1. **Standardize Node Version**: Align all repositories to Node 20 or 22 (LTS) to avoid runtime inconsistencies.
2. **Dockerize external services**: Ensure `docker-compose.yml` in `ppos-shared-infra` pins specific versions for Redis and MySQL.
3. **Automate GS installation**: Add a check/install step for Ghostscript in the bootstrap process.
