# Federated State Convergence Model
# PrintPrice OS — Multi-Region Consistency

The Federated State Convergence layer ensures that all regions in the PrintPrice OS ecosystem eventually arrive at the same state, regardless of event delivery order, network partitions, or regional failovers.

## 1. The Convergence Pipeline

Every federated event undergoes a deterministic 5-stage processing pipeline:

1. **Verification**: Cryptographic signature check (Ed25519) ensures the envelope is authentic.
2. **Authorization**: Origin check ensuring the sender region has the authority to emit the specific event type.
3. **Conflict Detection**: Version and Epoch checks prevent stale updates or out-of-order execution.
4. **Application**: Execution of idempotent reducers that update local state (DB/Cache).
5. **Auditing**: Recording the transition in the `ConvergenceLedger` for post-facto consistency verification.

## 2. Safety Mechanisms

### 2.1 Authority Epochs
When a regional failover occurs, the `authority_epoch` is incremented. The system will favor events from higher epochs, effectively "resetting" any stale state from previous partitions.

### 2.2 State Versioning
Each entity (Printer, Tenant, Policy) maintains a monotonic version counter. Events with a lower version than the local state are rejected as `STALE_VERSION`.

### 2.3 Idempotency
Application is designed so that receiving the same event multiple times results in exactly one state change. Subsequent deliveries are skipped but recorded as `DUPLICATE`.

## 3. Drift Detection

Regions periodically exchange "State Fingerprints"—SHA256 hashes of their entity versions. A mismatch in fingerprints alerts operators to "Regional Drift", triggering an automated or manual `ReplayCycle` to restore consistency.

## 4. Quarantine
Events that are valid but cannot be applied (e.g., missing dependencies or temporary conflict) are moved to the `QuarantineStore`. They do not block the inbox but remain available for forensic analysis or late-binding resolution.
