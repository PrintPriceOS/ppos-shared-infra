# Red Team Report: Reproducibility & Build Validation

## Audit Objective
Attempt a full platform rebuild from a "Scorched Earth" state to confirm that no undocumented or manual steps are required.

## The "Scorched Earth" Test
1. **Wipe Environment**: `rd /s /q .` (except git).
2. **Re-bootstrap**: Run `bootstrap-repos.ps1`.
3. **Attempt Build**: Run `npm install && npm run build`.

## Validation Results

| Component | Status | Result |
| :--- | :--- | :--- |
| **Orchestration** | 🛑 Failed | `bootstrap-repos.ps1` doesn't handle workspace symlinking. |
| **Shared Infra** | ✅ Success | Built successfully (it's a library). |
| **Governance** | 🛑 Failed | **Missing package.json**. |
| **Control Plane** | 🛑 Failed | Built locally but depends on hardcoded `localhost` URLs in `.env`. |
| **Preflight Engine** | ⚠️ Partial | Built, but tests fail due to missing `gs` binary on local machine. |

## Undocumented Required Steps Found
The following steps are **REQUIRED** but **NOT** in the repository scripts:
1.  **Manual Ghostscript Installation**: User must download and install GS 10.0x and add it to PATH.
2.  **Manual .env Setup**: User must copy `.env.example` to `.env` in 5 different directories.
3.  **Manual Symlinking**: The "Materialized" repos need to be linked via `npm link` or `pnpm workspace` manually if not using the (incomplete) monolith bridge.
4.  **Database Seeding**: The `docker-compose` starts MySQL, but the `preflight_` schema and tables must be created manually using `schema.sql`.

## Reproducibility Verdict: 🛑 NOT REPRODUCIBLE
An engineer cloning this repository for the first time would spend **2-4 hours** "Fighting the infrastructure" before seeing the first successful PDF analyze.

## Remediation Plan
1. **P0: Master Makefile/Script**: Create a single `setup.sh` (or `setup.ps1`) that handles ALL installs, env copies, and symlinking.
2. **P1: Auto-Migrations**: Integrate `Sequelize` or `TypeORM` migrations so the database schema is built automatically on first boot.
3. **P2: Pre-packaged Binaries**: (For Dev) Include a `bin/` folder with a portable version of Ghostscript or a script to `brew install` / `choco install` it.
