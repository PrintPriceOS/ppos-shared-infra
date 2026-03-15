# Phase 18.C - Platform Detachment Documentation

## Overview
Phase 18.C marked the formal structural decoupling of the Preflight product from the legacy monolithic engine. The application transitioned from a hybrid execution host to a lean service consumer of PrintPrice OS (PPOS).

## 1. Architectural Transformation

### Before (Hybrid Monolith)
- Direct imports of `@ppos/preflight-engine`.
- Ghostscript and Poppler binaries running inside the web server process.
- Local BullMQ workers managing background jobs.
- 300+ Pseudo-adapters masking engine logic.

### After (Decoupled Product Surface)
- **100% Delegated Execution**: All PDF processing (Analyze, AutoFix, Layout) is proxied to `ppos-preflight-service` via HTTP.
- **Lean Runtime**: Ghostscript/Poppler removed from Dockerfile; no local child-process execution.
- **Service Bridge**: `pdfPipeline.js` acts as the single boundary point.
- **Safe BFF**: Background workers disabled; monolith logic purged.

## 2. Component Map

| Component | Role | Location |
|:---|:---|:---|
| **Preflight Product** | UI & User Surface | `PrintPricePro_Preflight-master` |
| **Product BFF** | Session, Context, Proxy | `server.js` |
| **Service Bridge** | PPOS Interface | `services/pdfPipeline.js` |
| **Platform Service** | Orchestration & API | `ppos-preflight-service` (Remote) |
| **Platform Worker** | Computation | `ppos-preflight-worker` (Remote) |
| **Platform Engine** | Deterministic Logic | `ppos-preflight-engine` (Remote Library) |

## 3. Boundary Enforcement (Monolith Guard)
A mandatory build gate is enforced via `scripts/boundary-check.js`. 
**Failure Conditions:**
- Any match for `require('ppos-preflight-engine')`.
- Any spawn call for `gs`, `pdfimages`, or `qpdf`.
- Any local Worker thread creation (`new Worker`).
- Reintroduction of `bullmq` in product code.

## 4. Operational Proof (Readiness Gate)
Verification evidence collected via `scripts/validate-ppos-bridge.js`:
- [x] **G1**: Successful Analyze delegation.
- [x] **G2**: Successful AutoFix delegation.
- [x] **G3**: Graceful failure on service unavailability.
- [x] **G7**: Report Viewer data persistence verified.

## 5. Next Phase: Phase 19
**Target**: Control Plane & Surface Separation.
- Move Admin to `control.printprice.pro`.
- Move Demo to `demo.printprice.pro`.
- Implement OpenAPI/Swagger contracts for PPOS services.
