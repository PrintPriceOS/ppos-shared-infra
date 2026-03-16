# RegionContext MVP — PrintPrice OS

## 1. Overview
The `RegionContext` provides the identity and policy profile for a specific PPOS regional deployment. It is the source of truth for all cross-region awareness logic.

## 2. Implementation
- **Location**: `ppos-shared-infra/packages/region/RegionContext.js`
- **Source**: Environment variables (`PPOS_REGION_ID`, `PPOS_REGION_ROLE`, etc.).

## 3. Key Attributes
| Attribute | Description | Default (Dev) |
| :--- | :--- | :--- |
| `region_id` | Unique identifier for the region. | `DEV-LOCAL` |
| `region_role` | `primary`, `secondary`, or `edge`. | `primary` |
| `residency_mode`| `strict` or `permissive`. | `strict` |
| `compliance_profile` | Applied policy (e.g., `GDPR`). | `GDPR-MINIMAL` |

## 4. Usage
```javascript
const { regionContext } = require('@ppos/shared-infra');
const ctx = regionContext.get();
console.log(`Running in region: ${ctx.region_id}`);
```
