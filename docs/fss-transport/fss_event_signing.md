# FSS Event Signing — PrintPrice OS

## 1. Overview
Cryptographic signatures are the foundation of trust in the PrintPrice OS federation. Every event leaving a region must be signed to guarantee **Authenticity** and **Integrity**.

## 2. Algorithm: Ed25519
We use **Ed25519** (RFC 8032) for all federated signatures:
- **Performance**: Extremely fast signing and verification.
- **Security**: High security level with small key sizes (32 bytes).
- **Determinism**: Unlike ECDSA, Ed25519 is deterministic and doesn't require a high-quality nonce.

## 3. Implementation Logic
The `EventSigner` class in `ppos-shared-infra` handles:
1. **Canonicalization**: Converting the envelope (minus signature fields) into a deterministic JSON string.
2. **Signing**: Producing a Base64 encoded signature.
3. **Verification**: Using the origin region's public key to validate the payload.

## 4. Key Management
- **Local Dev**: Mock keys are generated or loaded from `.runtime/secrets/keys`.
- **Production**: Keys must be managed by a Hardware Security Module (HSM) or a secure Secret Manager with regional isolation.

## 5. Trust Policy
Any event received with an invalid signature or from an unmapped `region_id` is rejected and moved to quarantine.
