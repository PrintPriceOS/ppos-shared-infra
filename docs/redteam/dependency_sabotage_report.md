# Red Team Report: Dependency Sabotage

## Audit Objective
Deliberately disable or corrupt core runtime dependencies to observe system resilience and failure transparency.

## Sabotage Scenarios

### ⚡ Scenario A: "The Ghost in the Machine" (Missing Ghostscript)
- **Action**: Rename/Delete `gs` binary.
- **Observed Behavior**: `Ghostscript.js` executes `execAsync(commandLine)`. The promise rejects with `GS_ERROR`.
- **System Impact**: 🛑 **System Crash**. The error propagates up through `pdfPipeline.js`. If the caller doesn't have a specific try-catch for this, the worker process might exit or hang.
- **Resilience Rating**: Low. No pre-flight check exists to warm the operator before submitting a job.

### ⚡ Scenario B: "Redis Blackout"
- **Action**: Stop the Redis service.
- **Observed Behavior**: `ioredis` begins an infinite retry loop.
- **System Impact**: ⚠️ **Degraded State**. BullMQ jobs cannot be enqueued. The service remains "up" (200 OK) but all processing attempts return 500 or hang until timeout.
- **Resilience Rating**: Medium. The system survives but "lies" about its health.

### ⚡ Scenario C: "Node Version Mismatch"
- **Action**: Run the app on Node v14.
- **Observed Behavior**: `package.json` specifies `>=20`, but `npm install` only warns.
- **System Impact**: 🛑 **Startup Crash**. Uses modern features like `matchAll` or `optional chaining` that fail in older runtimes.
- **Resilience Rating**: Low. Missing `engines` enforcement in `preinstall` scripts.

### ⚡ Scenario D: "Missing Infrastructure Link"
- **Action**: Delete `ppos-shared-infra` directory.
- **Observed Behavior**: Legacy `db.js` attempts a `require()` which fails.
- **System Impact**: 🛑 **Fatal Error on Boot**. The catch block tries another relative path which is also missing.
- **Resilience Rating**: Very Low. Cross-repo coupling is a single point of failure.

## Resilience Weaknesses
1. **Fatalist Error Strategy**: Errors are caught but usually just logged and thrown. There is no concept of "Circuit Breaking" or "Maintenance Mode" when core binaries are missing.
2.  **Silent Failures**: The `db.js` fallback to `localhost:3306` can lead to developers writing data to their local machine instead of the intended (but unreachable) production database.

## Remediation Plan
1. **Implement Hard Guards**: Every service should run `checkAllDependencies()` on boot and **refuse to start** if `gs` or `convert` is missing.
2.  **Circuit Breakers**: Use the `CircuitBreakerService.js` (found in shared-infra) to wrap all Redis/DB calls, allowing the UI to show a "Partial Outage" notice instead of a spinning loader.
3.  **Strict Engine Check**: Add `"preinstall": "npx only-allow-node >=20"` to all `package.json` files.
