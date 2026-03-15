# Federated Governance Report — PrintPrice OS

## 1. Network Verification Model
Governance is applied at the network perimeter.

| Rule Type | Enforcement Mechanism | Failure Action |
| :--- | :--- | :--- |
| **Node Identity** | HMAC-SHA256 Handshake | Connection Rejected. |
| **Trust Scoring** | Dynamic based on Job Success/Failures | Node Downgrade / Blacklist. |
| **Offer Integrity** | Dispatch state lock (Atomic) | Concurrent Acceptance Denied. |
| **Policy Bounds** | `ppos-governance-assurance` | Job rejected before offer creation. |

## 2. Threat Simulation Results
- **Malicious Node**: Node attempts to "snipe" jobs without credentials. **Outcome**: Blocked by `requirePrinterAuth`.
- **Capability Falsification**: Node claims capabilities it doesn't have. **Outcome**: Caught by production state monitoring if a node consistently fails `received` handshakes.
- **DDoS/Spam**: Rate limiting applied at the Control Plane API level.

## 3. Conclusions
The FPN utilizes a **Zero-Trust Connection Model**. No node is trusted without a valid cryptographic handshake and a verified history of production fulfillment.
