# Red Team Report: Environment Variable Chaos

## Audit Objective
Simulate incorrect, missing, or conflicting environment variables to test the configuration robustness of PrintPrice OS.

## Attack Vectors & Results

| Test Case | Simulated Input | Expected Result | Actual Result |
| :--- | :--- | :--- | :--- |
| **Missing DB URL** | `UNSET DATABASE_URL` | Graceful boot error | ⚠️ **SILENT FALLBACK**. App connects to `localhost:3306/preflight_dev`. **CRITICAL RISK**: Data may be leaked to local DBs in production environments. |
| **Invalid Port Conflict**| `PORT=80` (no sudo) | Permission Error | 🛑 **UNCAUGHT EXCEPTION**. Server crashes and enter a restart loop. |
| **Malformed JWT Secret**| `JWT_SECRET=""` | Reject startup | ⚠️ **WEAK SECURITY**. Some routes may proceed with an empty secret, making token forging trivial. |
| **Ghostscript Confusion**| `GS_PATH="ping"` | Command Error on use | 🛑 **RUNTIME CRASH**. The system only realizes the config is wrong when it's too late (during PDF processing). |

## Fragility Points
1. **Config Silos**: Every repo has its own `.env` logic. There is no "Global Config Validator" ensuring and synchronizing keys across the cluster.
2. **Default Fallbacks**: Hardcoded strings like `'mysql://root@localhost:3306/preflight_dev'` in `shared-infra/packages/data/db.js` are dangerous. Production code should **never** fall back to local dev defaults.
3. **Lazy Loading**: Most variables are read only when needed (`process.env.XXX` inside functions). This prevents "Fail Fast" behavior on startup.

## Resilience Assessment
- **Score**: 4/10
- **Diagnosis**: The system is "Configuration-Brittle". It assumes the `.env` is perfect and doesn't validate it until it's forced to.

## Remediation Plan
1. **Remove Local Fallbacks**: Delete all hardcoded connection strings. Use `process.env.DATABASE_URL || throw Error()`.
2. **Centralize Validation**: Create a `ppos-shared-infra/config` module that uses `Zod` or `Joi` to define a schema for ALL variables and validates them once on process start.
3. **Synchronized `.env`**: Use a single `.env` at the root of the monorepo and symlink it to sub-repos, or use a tool like `dotenv-vault`.
