# FSS Service Integration MVP — PrintPrice OS

## 1. Overview
Demonstrates how regional services consume the Multi-Region Awareness Layer.

## 2. Integrated Points

### 2.1 Preflight Service - Admin FSS Support
- **Route**: `/admin/fss-test/publish-printer`
- **Function**: Allows creating and publishing printer identity events to the global outbox.

### 2.2 Shared Infra - Printer Registry (Planned)
- Future integration: `printerRegistryService.register()` will automatically trigger `fssAdapter.publishPrinterIdentityEvent()`.

## 3. Compliance Testing via Code
A test route `/admin/fss-test/publish-unsafe` was implemented to prove that the service correctly blocks attempts to publish payloads containing absolute paths (e.g., `C:\Users\...`).

## 4. Operational Visibility
All integrations utilize the structured logging from `FSSAdapter`, providing clear console evidence of `PUBLISH_ALLOWED` vs `PUBLISH_DENIED` status.
