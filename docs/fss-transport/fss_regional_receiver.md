# FSS Regional Receiver & Inbox — PrintPrice OS

## 1. Overview
The Regional Receiver is the frontline security gate for inbound federated state. It ensures that only verified, authorized, and non-duplicate events entered the regional control plane.

## 2. Reception Endpoint
- **URL**: `POST /fss/replicate`
- **Security**: Requires a valid Ed25519 signature in the envelope.
- **Deduplication**: Uses a local index to prevent processing the same event twice (at-least-once delivery protection).

## 3. The Regional Inbox
Accepted events are durably stored in `.runtime/fss-inbox/events.jsonl`. This inbox acts as the regional "ledger" of global state transitions.

### Record Lifecycle
1. **RECEIVED**: Payload reached the endpoint.
2. **VERIFIED**: Signature and origin are confirmed against the trust registry.
3. **STORED**: Event is written to the inbox log.
4. **QUARANTINED**: If verification fails, the event is saved to a secure directory for audit.

## 4. Deduplication Logic
Each region maintains a `dedupe_index.json`. 
- **Key**: `event_id` (UUID).
- **Value**: `received_at` (Timestamp).
- **Benefit**: Allows the `OutboxRelay` of other regions to safely retry deliveries without causing side effects.

## 5. Trust Registry Integration
The receiver lookups the public key based on the `origin_region` field. This prevents "Region Masquerading" where one region attempts to publish state on behalf of another.
