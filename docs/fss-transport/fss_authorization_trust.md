# FSS Authorization & Trust — PrintPrice OS

## 1. Regional Trust Registry
Every PPOS region maintains a local trust registry mapping `region_id` to its public Ed25519 key. This registry is the "Source of Truth" for authenticating incoming replication requests.

## 2. Capability RBAC
Not all regions are created equal. The FSS enforces **Role-Based Federated Access**:
- **Role: REGIONAL_CONTROL**: Allowed to publish health summaries and printer registrations.
- **Role: GLOBAL_GENESIS**: Authorized to publish `PolicyPublished` and `OrgStateUpdated`.

## 3. Revocation & Rotation
Trust can be revoked by removing a key from the registry. If a regional key is compromised, all sibling regions must be updated to reject any further events signed by the old key.

## 4. Replay-Window Enforcement
To mitigate "Snapshot Recovery" attacks, events with a timestamp discrepancy of more than 10 minutes from the arrival time are rejected, unless they are part of an authorized bulk replay.
