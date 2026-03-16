# PrintPrice Product — Decoupling & Adapter Implementation

## 1. Overview
The product repository has been successfully decoupled from the core OS logic. It now acts as a client that delegates all heavy lifting to the `ppos-preflight-service`.

## 2. Refactored Adapters

### `services/pdfPipeline.js`
- **Role**: High-level PDF operation adapter.
- **Changes**: 
    - Updated `analyzePdf` to call `POST /preflight/analyze`.
    - Updated `gsConvertColor` and `addBleedCanvasPdf` to call `POST /preflight/autofix`.
- **Status**: **READY**

### `services/queue.js`
- **Role**: Job delegation bridge.
- **Changes**:
    - Updated `enqueueJob` to call the canonical PPOS `/preflight/autofix` endpoint.
- **Status**: **READY**

## 3. Legacy Logic (Deprecation)
The following files have been marked with a `DEPRECATED` header and should be removed after the integration is fully validated:
- `services/internal/reportCore.js`
- `services/internal/reportEnricher.js`
- `services/heuristicService.js`
- `workers/preflightWorker.js`

## 4. Operational Flow
1. **User Uploads File**: handled by internal `routes/preflightV2.js`.
2. **Product calls Adapter**: `pdfPipeline.analyzeSync(asset)`.
3. **Adapter calls OS**: `POST http://localhost:3000/preflight/analyze`.
4. **Result**: Returned to Product UI.
