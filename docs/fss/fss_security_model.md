# FSS Security Model — PrintPrice OS

## 1. Trust Architecture
FSS operates on a **Chain of Trust** model. No region is trusted inherently; only validly signed events are accepted.

### 1.1 Regional Identity
- Each region (EU, US, AP) possesses a unique **Identity Keypair** (Ed25519).
- The Hub (Genesis) maintains a **Global Public Key Registry**.

## 2. Event Integrity
- **Authenticity**: Every state update is signed by the originating regional private key.
- **Integrity**: Any modification to the payload after signing will invalidate the signature check at the consumer node.
- **Replay Protection**: Every event includes a `nonce` and a `timestamp`. Events older than a 5-minute window or with a duplicate nonce are discarded.

## 3. Key Management Strategy
- **Development**: Keys stored in `.runtime/secrets/` (Ignored).
- **Industrial**: Keys injected into memory via Docker Secrets or TPM (Trusted Platform Module) backed Hardware Security Modules (HSMs).
- **Rotation**: Keys can be rotated by publishing a `RegionalKeyUpdated` event signed by the **Genesis Global Key**.

## 4. Attack Mitigation

| Attack Vector | Countermeasure |
| :--- | :--- |
| **State Injection** | Signature verification blocks any forged payloads. |
| **Split-Brain** | Sequence numbers and Global Authority rules ensure convergence. |
| **Data Leakage** | `FSS-Filter` ensures only metadata leaves the region. |
| **MitM Attack** | Full mTLS encryption on the cross-region bus. |

## 5. Security Gates: Quarantine
If a region publishes more than `N` invalid signatures within a minute, the Hub automatically **Quarantines** that region, revokingIts synchronization rights until a manual security audit is completed.
