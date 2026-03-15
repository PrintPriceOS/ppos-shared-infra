# FSS Audit Logging MVP — PrintPrice OS

## 1. Overview
The FSS system generates high-integrity logs to track the dissemination of global state.

## 2. Event Log Structure (Outbox)
Events are stored in `JSONL` format in `.runtime/fss-outbox/events.jsonl`. This ensures:
- **Atomicity**: One event per line.
- **Inspectability**: Human-readable JSON.
- **Replayability**: New consumers can read the file from the start.

## 3. Runtime Decision Logs
Console logs are emitted for every interaction with the adapter:

- `[FSS-ADAPTER] Attempting publish`: Sent before any logic.
- `[FSS-ADAPTER] SUCCESS`: Emitted after successful outbox write.
- `[FSS-ADAPTER] PUBLISH_DENIED`: Emitted when `RegionFilter` blocks a payload.

## 4. Sample Decison Log
```text
[FSS-ADAPTER] Attempting publish: UnsafeEvent (uploaded_pdf:unsafe-001)
[FSS-ADAPTER] PUBLISH_DENIED: [COMPLIANCE-BLOCK] Entity type 'uploaded_pdf' is restricted to its home region.
```
