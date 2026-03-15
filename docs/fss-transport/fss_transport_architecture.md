# FSS Transport Architecture — PrintPrice OS

## 1. Executive Summary
The **FSS Transport Layer** is the communication bridge for the Federated State Synchronizer. It is designed to move signed control-state events between regional hubs while maintaining strict non-repudiation and replay safety.

## 2. MVP Topology: Signed HTTP Push
For the MVP, we utilize a **Point-to-Point Signed Push** model:
- **Source**: Regional Outbox (`events.jsonl`).
- **Relay**: `OutboxRelay` service (Node.js).
- **Transport**: HTTPS with Mutual Trust (Signature-based).
- **Destination**: Remote Regional Receiver (`/fss/replicate`).
- **Storage**: Regional Inbox (`inbox.jsonl`).

### Why this model?
- **Simplicity**: No need for complex Kafka/NATS clusters across regions in the initial rollout.
- **Inspectability**: Human-readable append-only logs make auditing easy during development.
- **Security-First**: Enforces signature verification before any data enters the regional inbox.
- **Resilience**: Naturally supports retries and "Replay from Offset" logic.

## 3. Data Flow
1. **Emit**: Service writes to local Outbox.
2. **Relay Sweep**: `OutboxRelay` reads PENDING events.
3. **Seal**: `EventSigner` signs the envelope using the Regional Private Key (Ed25519).
4. **Push**: `ReplicationClient` POSTs to remote regional endpoints.
5. **Verify**: Remote `SignatureVerifier` checks the Ed25519 signature.
6. **commit**: If valid, appended to remote Inbox.
7. **Apply**: `ReplicationApplier` processes the event idempotently.

## 4. Federated Trust Model
Trust is decentralized but governed by a **Global Key Registry**. Every region knows the public keys of all authorized peer regions. Any message from an unknown or mismatched key is automatically quarantined.
