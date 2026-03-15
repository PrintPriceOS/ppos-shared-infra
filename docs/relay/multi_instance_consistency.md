# Multi-Instance Consistency Model (v1.8.0)

## Guarantee
PrintPrice OS guarantees **Monotonic State Convergence** across multiple regional instances for all federated entity types.

## Conflict Arbitration Logic
Arbitration is strictly deterministic based on:
1. **Authority Epoch**: Higher epoch always wins (Failover/Re-authoring).
2. **State Version**: Same epoch requires strictly increasing versions (`Event.v > Local.v`).
3. **Idempotency**: Same epoch and same version results in `SKIPPED_DUPLICATE`.

## Concurrency Handling
By offlisting the version store to a regional Redis cluster:
- **No Split-Brain**: Instances do not diverge in their version history.
- **Immediate Invalidation**: The moment Instance A commits a version, Instance B rejects any older versions for that entity.
- **Fail-Safe Startup**: New instances hydrate their version cache (if used) from the shared store during `init()`.

## Validation Strategy
Consistency is verified using simulated multi-instance test suites (`tests/federated_multi_instance_test.js`) which verify:
- Version detection across logical instances.
- Rejection of stale events after a shared state update.
- Consistent epoch handling.
