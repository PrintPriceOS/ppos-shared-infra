# Authority Revocation & Rollover — PrintPrice OS

## 1. Trust Lifecycle
Regional authority is not permanent. It can be revoked or rotated based on security policy, administrative migrations, or incident response.

## 2. Revocation Scenarios
- **Key Compromise**: The regional signing key is leaked.
- **Migration**: Authority moves from `EU-PPOS-1` to `US-PPOS-1` as part of a global infrastructure swap.
- **Node Seizure**: A region is compromised and must be "cut off" from the global gossip network.

## 3. Propagation Path
Revocation is broadcast via a **High-Priority Federation Event**:
1. `RevocationRecord` is signed by a **Genesis Key** or the current `GLOBAL_HUB`.
2. Every peer region receives the record.
3. Peer regions immediately purge the local `PolicyCache` associated with the revoked key.
4. Peer regions update their `TrustRegistry` to blacklist the revoked `key_id`.

## 4. Key Rollover
To rotate keys without downtime:
1. The new key is added to peer regions as "TRUSTED_REPLACEMENT".
2. The old key remains active for a 24-hour **Grace Period**.
3. After 24 hours, the old key is revoked, and the new key is promoted to `ACTIVE`.

## 5. Security Guardrail
A revoked region is prohibited from re-joining the federation until a signed `RegionReintegrationEvent` is processed by the majority of the global network.
