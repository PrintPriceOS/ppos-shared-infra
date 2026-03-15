# Signed Envelope Model
# PrintPrice OS — Federated Transport

The FSS Envelope has been extended to support cryptographic signatures, ensuring that every event published to the federated network is authentic and has not been tampered with during transit.

## 1. Canonical Envelope Structure (v1.1)

The signed envelope wraps the event metadata and payload, adding a signature block.

```json
{
  "fss_version": "1.1",
  "event_id": "uuid-v4",
  "event_name": "EventName",
  "origin_region": "REGION-ID",
  "entity_type": "entity_class",
  "entity_id": "entity-id",
  "event_timestamp": "ISO-8601",
  "causality_id": "vector-clock-or-sequence",
  "classification": "GLOBAL",
  "payload": {
    "data": "..."
  },
  "signature": "base64-ed25519-signature",
  "signature_algorithm": "Ed25519",
  "key_id": "REGION-ID-key-v1"
}
```

## 2. Signing Process

1. **Canonicalization**: The envelope (excluding the `signature` field) is serialized into a deterministic JSON string.
2. **Hasing/Signing**: The Ed25519 algorithm is used to sign the bytes of the canonical string using the Region's Private Key.
3. **Attachment**: The resulting signature is base64-encoded and placed in the `signature` field of the final envelope.

## 3. Verification Logic

Receiving regions verify the envelope by:
1. Extracting the `signature` and `key_id`.
2. Locating the Public Key associated with `key_id` in the Regional Registry.
3. Re-creating the canonical JSON string (without the `signature`).
4. Verifying the signature against the canonical string using the Public Key.

## 4. Integrity Guarantees

* **Authenticity**: Only the region specified in `origin_region` could have generated the signature.
* **Non-Repudiation**: The origin region cannot deny having published the event once signed.
* **Tamper Proofing**: Any modification to the payload or metadata (e.g., changing timestamps or region IDs) will cause verification to fail.
