# Durable Regional State Backend (v1.8.0)

## Overview
Phase v1.8.0 transitions the federated state convergence from a local-only memory/file model to a durable, shared regional backend using **Redis**. This ensures that multiple instances of the PrintPrice OS services within a geographic region maintain a consistent view of applied versions and authority epochs.

## Architecture
The `ConflictDetector` now utilizes a pluggable `StorageProvider` abstraction. In production-oriented environments, this is mapped to `RedisVersionStore`.

### Storage Schemas (Redis HASH)
- **Key**: `ppos:fss:versions:{region_id}`
- **Field**: `{entity_type}:{entity_id}`
- **Value**: JSON string containing:
  ```json
  {
    "state_version": 42,
    "authority_epoch": 2,
    "updated_at": "2026-03-15T17:00:00Z"
  }
  ```

## Atomic Operations
The `RedisVersionStore` implements atomic updates using Redis HASH operations (`hset`, `hget`). This prevents race conditions where two instances might try to apply different versions of the same entity simultaneously.

## Multi-Instance Synchronization
When a new event arrives at Instance A:
1. `inspect()` queries Redis for the latest known version.
2. If allowed, `apply()` executes domain logic.
3. `update()` persists the new version back to Redis.
4. Instance B will immediately see the updated version upon its next `inspect()`.

## Configuration
Durable storage is activated by providing the `RedisVersionStore` to the `ConflictDetector` constructor or setting it as its storage property during initialization.
