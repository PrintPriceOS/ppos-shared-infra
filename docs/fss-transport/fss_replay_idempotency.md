# Replay & Application — PrintPrice OS

## 1. Replay Safety
Federated synchronization is inherently asynchronous and prone to network disruptions. The **ReplayEngine** ensures that no event is lost, even if a region is offline for days.

### Sequential Integrity
The engine reads the regional Inbox starting from the last known `apply_checkpoint.json`. This ensures that events are applied in the order they were accepted by the receiver.

## 2. Idempotency Invariants
The `ReplicationApplier` is designed to be idempotent:
- **Printer Registry**: Re-registering the same printer results in an update or a no-op, never a duplicate entry.
- **Policies**: Applying the same policy version twice does not trigger redundant governance re-evaluations.

## 3. Conflict Resolution primitives
We implement **Authority-Based Conflict Resolution**:
- **Policies**: Only the `Global Hub` (currently `EU-PPOS-1`) has the authority to publish `PolicyPublished` events. Events from secondary regions are rejected by the applier.
- **Printer Metadata**: The `Origin Region` of a printer has absolute authority over its own metadata. No other region can overwrite a printer node's capability map except its home region.

## 4. Operational Loop
Global state convergence is achieved via a recurring loop:
`Local Outbox` -> `Remote Inbox` -> `Local Applier` -> `Global Consistency`.
