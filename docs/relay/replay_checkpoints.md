# Replay Checkpoints — Federated State Synchronizer

## Objective
Enable industrial-scale recovery by avoiding full reprocessing of the regional inbox.

## Mechanism
The `ReplayCheckpointStore` maintains a "High-Water Mark" in Redis for each (Region, Domain) combination.

### Checkpoint Schema
```json
{
  "region_id": "EU-PPOS-1",
  "domain": "tenant",
  "last_applied_event_id": "evt-8291",
  "last_applied_version": 142,
  "checkpoint_at": "2026-03-15T15:00:00Z",
  "fingerprint_hash": "a1b2c3d4..."
}
```

## Lifecycle
1. **Startup**: The `ReplayEngine` queries the checkpoint for its assigned domains.
2. **Execution**: Replay starts exactly from the event FOLLOWING the checkpoint.
3. **Commit**: Every $N$ events or every $T$ seconds, the engine updates the checkpoint.
4. **Validation**: If the local state fingerprint does not match the checkpoint's hash, a Rebuild is triggered.
