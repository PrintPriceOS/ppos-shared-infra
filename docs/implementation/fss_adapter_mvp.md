# FSS Adapter MVP — PrintPrice OS

## 1. Overview
The `FSSAdapter` provides a stable, unified interface for all services to publish global state.

## 2. Implementation
- **Location**: `ppos-shared-infra/packages/fss/FSSAdapter.js`
- **Mechanism**: Local append-only `events.jsonl` in `.runtime/fss-outbox/`.

## 3. Core Methods
| Method | Purpose |
| :--- | :--- |
| `publishGlobalEvent()` | Lower-level generic event publication with full compliance checks. |
| `publishPolicyEvent()` | High-level helper for propagating governance shifts. |
| `publishPrinterIdentityEvent()`| Helper for announcing new regional capacity. |
| `publishRegionHealthSummary()` | Helper for publishing ephemeral telemetry. |

## 4. MVP Flow
1. Service calls `fssAdapter`.
2. Adapter verifies region context.
3. Adapter runs payload through `RegionFilter`.
4. If valid, adapter builds `FssEventEnvelope` and writes to the local outbox.
5. If invalid, the adapter returns `{ ok: false, error: "..." }`.

## 5. Design Decisions
- **Outbox Pattern**: Storing events locally ensures persistence if the (future) transport layer is down and provides an easy replay mechanism.
- **Fail-Fast Compliance**: Any restricted payload is rejected synchronously at the adapter level.
