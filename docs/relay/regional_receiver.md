# Regional Receiver
# PrintPrice OS — Federated Transport

The Regional Receiver is the ingress point for federated events. It is responsible for verifying the authenticity and authorization of inbound events before committing them to the regional inbox.

## 1. Endpoint: `POST /fss/relay`

All federated peers send their signed events to this endpoint.

### 1.1 Ingress Pipeline

1. **Origin Verification**: Ensures the `origin_region` is a known peer.
2. **Signature Verification**: Uses `SignatureVerifier` to check the cryptographic signature.
3. **Authorization Check**: Validates that the sending region has the authority to publish this specific event (e.g., only the logic-authority region can publish `PolicyPublished`).
4. **Deduplication**: Checks `RelayDedupeIndex` to see if the `event_id` has already been processed.
5. **Ingestion**: Valid events are written to the `InboxStore`.
6. **Quarantine**: Invalid signatures or unauthorized events are moved to `.runtime/fss-quarantine/` for forensics.

## 2. Response Statuses

| Status | Code | Meaning |
| :--- | :--- | :--- |
| **ACCEPTED** | `202` | Event verified and committed to inbox. |
| **DUPLICATE** | `200` | Event already processed (idempotent ACK). |
| **REJECTED_INVALID_SIGNATURE** | `401` | Signature check failed. |
| **REJECTED_UNAUTHORIZED** | `403` | Sender lacks authority for this event type. |
| **REJECTED_MALFORMED** | `400` | Invalid envelope structure or schema. |

## 3. Security Hardening

* **Public Key Pinning**: Public keys are loaded at startup and cannot be modified via API.
* **Payload Class Filtering**: Only events with globally replicable classifications (via `RegionFilter`) are accepted.
* **Audit Trail**: Every rejection is logged with the sender's IP and provided `origin_region` ID.
