# FSS Outbox Relay — PrintPrice OS

## 1. Overview
The `OutboxRelay` is the engine that drives asynchronous multi-region replication. Its job is to ensure that every validated event is eventually delivered to its regional peers.

## 2. Relay Mechanics
- **Watchman Pattern**: The relay periodically scans the `events.jsonl` file.
- **Checkpointing**: It maintains a `checkpoint.json` to keep track of the last successfully processed line, ensuring no duplicate processing on restart.
- **Push Delivery**: It uses signed HTTP POST requests to "push" state to peer regions.

## 3. Delivery Lifecycle
1. **PENDING**: Event exists in `events.jsonl` but hasn't been reached by the relay.
2. **SIGNING**: Relay canonicalizes and seals the event with the regional Ed25519 key.
3. **BROADCAST**: Relay attempts delivery to all mapped peer endpoints.
4. **ACKNOWLEDGED**: Target region responds with `200 OK`, confirming verification and storage.

## 4. Resilience: Retries & Gaps
If a peer region is offline (e.g., `ECONNREFUSED`), the relay logs the failure and continues. In the next sweep, it will re-attempt delivery for all events beyond its checkpoint.

## 5. Security Guardrail
Signature generation happens **inside** the relay process, immediately before transport. This ensures that the cryptographic proof is fresh and covers the exact same bits that will traverse the wire.
