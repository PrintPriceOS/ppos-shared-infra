# Relay Test Report
# PrintPrice OS — Federated Transport

The Federated State Sync (FSS) relay layer has been validated across 10 mission-critical scenarios covering signature integrity, authority enforcement, and fault tolerance.

## 1. Test Summary

| ID | Scenario | Result | Mechanism Tested |
| :--- | :--- | :---: | :--- |
| **TC-01** | Authority signs and relays `PolicyPublished` | **PASS** | `EventSigner` + `OutboxRelay` |
| **TC-02** | Unsigned envelope is rejected | **PASS** | `RegionalReplicationReceiver` |
| **TC-03** | Invalid signature is rejected | **PASS** | `SignatureVerifier` |
| **TC-04** | Duplicate event is deduplicated | **PASS** | `InboxStore` |
| **TC-05** | Forbidden classification is rejected | **PASS** | `FederatedAuthorizationService` |
| **TC-06** | Non-authority publisher is rejected | **PASS** | `FederatedAuthorizationService` |
| **TC-07** | Secondary region health report accepted | **PASS** | `FederatedAuthorizationService` |
| **TC-08** | Outage recovery via replay | **PASS** | `ReplayEngine` |
| **TC-09** | Malformed event quarantined | **PASS** | `RegionalReplicationReceiver` |
| **TC-10** | Restricted payload sanitized | **PASS** | `RegionFilter` |

## 2. Key Findings

* **Signature Integrity**: The Ed25519 model effectively blocks any attempt to spoof the origin region.
* **Granular Authority**: The system correctly distinguishes between "Global Authority" events (Policies) and "Regional Authority" events (Health).
* **Idempotency**: Identical events arrive in the inbox but only the first one is marked for application, preventing state divergence.
* **Quarantine Effectiveness**: All rejected events are stored with full context for forensic analysis without impacting the main log.

## 3. Test Environment

* **Test Runner**: `node tests/fss_relay_test.js`
* **Regions Simulated**: `EU-PPOS-1` (Authority), `US-PPOS-1` (Secondary).
* **Mocks**: Outbound HTTP calls mocked to verify relay payloads.
