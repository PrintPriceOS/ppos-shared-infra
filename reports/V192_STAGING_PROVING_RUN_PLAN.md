# Implementation Plan: V1.9.2 — Staging Proving Run

## 🎯 Objective
Validate the hardened PrintPrice OS (V1.9.1) under realistic operational conditions, ensuring integration integrity, security enforcement, and resilience.

---

## 🏗 Phase Breakdown

### 1. Integration "Smoke-to-Fire" Run
- **Product Context**: Configure `PrintPricePro_Preflight` to use the hardened OS endpoints.
- **E2E Trace**: Execute a full PDF analysis and autofix lifecycle using real industrial assets.
- **Sync vs Async**: Verify automatic switching between synchronous engine execution and asynchronous worker jobs based on load/file size.

### 2. Security & Policy Enforcement
- **Auth Negative Testing**: Verify that requests without `X-PPOS-API-KEY` or Bearer tokens are strictly rejected.
- **Header Propagation**: Ensure the Product BFF correctly propagates tenant context and metadata to the OS.

### 3. Resilience & Chaos Simulation
- **Service Outage**: Simulate a `ppos-preflight-engine` failure and verify the product's fail-fast response.
- **Queue Saturation**: Inject a burst of jobs to monitor BullMQ scaling and worker concurrency.
- **Redis Partition**: Simulate Redis unavailability to test the `QueueManager` retry and backoff logic.
- **Graceful Restart**: Perform rolling restarts of services during active processing to verify zero-data-loss shutdown.

### 4. Observability Audit
- **Log Correlation**: Trace a single request from the Product UI -> Preflight Service -> Worker -> Engine using unified JSON logs.
- **Health Aggregation**: Verify that the `ppos-control-plane` correctly aggregates health status from all regional instances.

---

## 📋 Success Criteria
- ✅ E2E lifecycle completed for real PDFs (Analyze + Autofix).
- ✅ Rejection of unauthorized requests at all OS boundaries.
- ✅ Successful recovery from simulated Redis and Service failures.
- ✅ Structured logs provided for all steps of the test trace.
- ✅ No "unhandled" crashes during service restarts.

---

## 🚀 Execution Strategy
1. **Initialize Staging Stack**: Launch all PPOS services in a local staging environment (isolated ports/Docker).
2. **Setup Test Suite**: Create `tests/staging_prov_run.js` to automate the chaos and E2E scenarios.
3. **Execution & Audit**: Run the proving run and generate the final certification report.
