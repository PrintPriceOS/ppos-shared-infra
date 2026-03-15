# Regional Key Model
# PrintPrice OS — Federated Transport

Each region in the PrintPrice OS ecosystem is assigned a unique cryptographic identity using Ed25519 key pairs. These keys are used to sign outbound FSS events and verify inbound ones.

## 1. Key Structure

* **Private Key**: Sensitive Ed25519 key used ONLY by the local region to sign envelopes.
* **Public Key**: Shared Ed25519 key used by remote regions to verify signatures.
* **Key ID**: A unique identifier for the key version (e.g., `EU-PPOS-1-key-v1`).

## 2. Configuration (MVP)

For the initial activation, keys are loaded from environment variables:

* `PPOS_REGION_PRIVATE_KEY`: Base64 encoded private key.
* `PPOS_REGION_PUBLIC_KEY`: Base64 encoded public key.
* `PPOS_REGION_KEY_ID`: Identifier for the current key.

## 3. Key Registry

In production, the `Public Key Registry` is managed by the Global Authority. For the MVP, regions maintain a local mapping of `RegionID -> PublicKey`.

| Region ID | Public Key (Base64) | Status |
| :--- | :--- | :--- |
| `EU-PPOS-1` | `...` | ACTIVE |
| `US-PPOS-1` | `...` | ACTIVE |

## 4. Security Requirements

1. **Private Key Isolation**: Private keys must never be logged, transmitted, or included in FSS envelopes.
2. **Deterministic Signing**: The signing process must be stable across different Node.js environments.
3. **Key Rotation**: The system is designed to support multiple active key IDs to facilitate rotation.

## 5. Implementation Modules

* **`EventSigner`**: Signs envelopes using the local private key.
* **`SignatureVerifier`**: Verifies envelope integrity using the sender's public key.
