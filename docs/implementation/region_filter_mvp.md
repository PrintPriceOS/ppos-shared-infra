# RegionFilter MVP — PrintPrice OS

## 1. Overview
The `RegionFilter` is the primary compliance gate. It prevents PII and industrial assets from leaking into the Global Control Plane.

## 2. Implementation
- **Location**: `ppos-shared-infra/packages/region/RegionFilter.js`

## 3. Security Layers
1. **Classification Gate**: Blocks any entity marked as `REGIONAL`.
2. **Deep Inspection**: Scans payloads for forbidden patterns:
    - Absolute file paths (Windows/Linux).
    - File extension (.pdf, .zip in metadata).
    - Keyword detection (`customer_id`, `secret`).
3. **Sanitization**: Auto-redacts fields ending in `_local` or matching sensitive keys.

## 4. Operational Guardrail
Any attempt to publish a restricted payload results in a `[COMPLIANCE-BLOCK]` error, which is logged with high priority for auditing.
