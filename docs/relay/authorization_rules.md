# Authorization Rules
# PrintPrice OS — Federated Transport

Not all regions are created equal. The Federated Transport Layer enforces strict authorization rules based on regional roles and the nature of the event being replicated.

## 1. Rule Matrix

| Event Type | Required Origin Authority | Logic |
| :--- | :--- | :--- |
| `PolicyPublished` | **Authoritative Region** | Only the primary region can change global policies. |
| `PrinterNodeRegistered` | **Authoritative Region** | Global printer onboarding is centralized for identity integrity. |
| `RegionHealthSummaryPublished` | **Any Valid Region** | All regions must report their own health status. |
| `QuarantineDecision` | **Authoritative Region** | Global tenant lockouts must originate from authority. |
| `CrossRegionAssignment` | **Any Valid Region** | Any region can request work from another. |

## 2. Enforcement Points

### 2.1 Egress Enforcer (OutboxRelay)
Before signing and sending, the local region checks its own authority status. If it tries to publish a `PolicyPublished` event while not being the authoritative region (according to its current policy cache), the event is blocked.

### 2.2 Ingress Enforcer (RegionalReceiver)
Upon reception, the receiver verifies the `origin_region` against the `PolicyAuthorityResolver`. If the sender claims to be publishing an authoritative event but isn't the current authority, the event is **REJECTED_UNAUTHORIZED** and quarantined.

## 3. Conflict Resolution

In cases of "Authority Flapping" (e.g., during a split-brain failover):
* Events with higher timestamps from the legitimate authority are preferred.
* Events from a stale or revoked authority are rejected.
* The `causality_id` (v1.2+) will eventually provide vector clock ordering.

## 4. Implementation

The rules are implemented in the `FederatedAuthorizationService` and integrated into the `RegionalReplicationReceiver`.
