# FSS Implementation Blueprint — PrintPrice OS

## 1. Component Architecture
Building on the R1-R13 foundation, the FSS introduces these new modules into `ppos-shared-infra`.

- **`fss-adapter`**: The main entry point for regional services (Preflight, Worker) to emit global state.
- **`fss-signer`**: Handles Ed25519 signatures using regional enclave keys.
- **`fss-broadcast`**: Publishes filtered events to the global bus.
- **`fss-cache-manager`**: Maintains the regional replica of the Global Governance Registry.

## 2. Technology Stack
- **Messaging**: Redis Streams (Regional) bridged by **NATS JetStream** (Global).
- **Serialization**: Protocol Buffers (Shared Contracts).
- **Security**: Kubernetes Secrets (Regional Keys) + mTLS.

## 3. Implementation Phases

### Phase 1: Metadata Foundation (MVP)
- Implement `fss-adapter` and `fss-signer`.
- Define the `OrgStateUpdated` contract.
- Enable regional cache for Organizations (Read-only).

### Phase 2: Regional Coordination
- Deploy Global Event Bus.
- Implement `fss-broadcast`.
- Propagate `PrinterNodeRegistered` events between EU and US.

### Phase 3: Resilience & Replay
- Implement the `fss-replay-engine`.
- Add **Partition Detection** to the Control Plane.
- Automated reconciliation logic for re-joining regions.

## 4. Prototype Service (Node.js)
```javascript
// ppos-shared-infra/packages/fss/FSSAdapter.js
const { signer, encoder, filter } = require('./utils');

class FSSAdapter {
    /**
     * Propagates local state change to the global network
     */
    async propagate(entityType, entityData) {
        // 1. Filter sensitive data (Isolation Mode)
        const cleanData = filter.apply(entityType, entityData);

        // 2. Wrap in Canonical Contract
        const event = encoder.wrap(entityType, cleanData);

        // 3. Sign the payload
        event.signature = await signer.sign(event);

        // 4. Publish to Global Bus
        await this.bus.publish('fss.global.state', event);
    }
}
```

## 5. Storage Model
- **Local Persistence**: Each region maintains a `printprice_os_fss_cache` in MySQL.
- **In-Memory Speed**: Critical policies are cached in Redis for < 1ms governance gates.
