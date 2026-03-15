# Compatibility Bridges

## 1. Overview
During the extraction, certain APIs or services might be moved but are still expected at their old endpoints by legacy clients or the current UI. We use **Transitional Adapters** to prevent breaks.

## 2. Active Bridges

### B1: Kernel Proxy
- **Old Location**: `PrintPricePro_Preflight-master/kernel/`
- **Transition**: Keep a thin `index.js` in the old location that exports from the new `@ppos/core-platform` package.
- **Expiry**: R5 (Infrastructure Serialization).

### B2: Connect API Proxy
- **Old Location**: `server.js` (`/api/connect`)
- **Transition**: Use a proxy middleware in the Product App to route `/api/connect` to the standalone `ppos-control-plane` service.
- **Expiry**: R4 (Federation Runtime Extraction).

### B3: Registry Adapter Shim
- **Old Location**: `services/registryAdapter.js`
- **Transition**: Retain the service interface but delegate all calls to the new Core Platform API.
- **Expiry**: R6 (Final Cleanup).

## 3. Bridge Rules
- Do NOT duplicate business logic.
- Log usage of bridges to identify which clients still use legacy paths.
- All bridges must be marked with `@deprecated`.
