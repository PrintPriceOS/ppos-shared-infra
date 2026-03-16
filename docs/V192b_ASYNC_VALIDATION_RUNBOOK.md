# Runbook: V1.9.2.b — Real Async Validation

This runbook describes the steps to validate the asynchronous path once Redis is available.

## 1. Infrastructure Setup (Redis)
Ensure Redis is running and accessible on `127.0.0.1:6379`.
- **Docker**: `docker run --name ppos-redis -p 6379:6379 -d redis:7-alpine`
- **Manual**: Start your local `redis-server`.

Verify connection:
```bash
node -e "const r=require('ioredis'); new r().ping().then(p => { console.log('Redis connected:', p); process.exit(0); }).catch(e => { console.error(e); process.exit(1); })"
```

## 2. Launch Staging Stack
Run the central staging launcher:
```bash
node scripts/launch-ppos-staging.js
```

**Expected Logs:**
- `[PREFLIGHT-WORKER] Worker consumer starting...`
- `[PREFLIGHT-SERVICE] Preflight active on port 8001`
- `[CONTROL-PLANE] Governance layer active on port 8080`

## 3. Execute Async Proving Run
Run the validation script specifically targeting the async path:
```bash
$env:PPOS_PREFLIGHT_SERVICE_URL="http://localhost:8001"; $env:PPOS_API_KEY="test-key"; node tests/staging_prov_run.js
```

## 4. Operational Checklist (Success Criteria)
- [ ] **Enqueue**: `POST /preflight/autofix` (without multipart) returns a `job_id`.
- [ ] **Processing**: `[PREFLIGHT-WORKER]` logs show `Job started` and `Job completed`.
- [ ] **Status Polling**: `GET /preflight/status/:jobId` transitions from `QUEUED` to `COMPLETED`.
- [ ] **Persistence**: Stopping/Restarting the worker does not lose jobs in the Redis queue.

## 5. Troubleshooting
- **ECONNREFUSED**: Redis is not running or port 6379 is blocked.
- **EADDRINUSE**: Another process is using ports 8001, 8002, or 8080.
- **Worker Crash**: Check if `pino-pretty` is missing in the worker's `node_modules`.
