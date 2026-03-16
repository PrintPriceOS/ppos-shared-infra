/**
 * PrintPrice OS — V1.9.0 Recovery & Health Test Suite
 */
const ReplayCheckpointStore = require('../ppos-shared-infra/packages/fss/recovery/ReplayCheckpointStore');
const ReplayEngine = require('../ppos-shared-infra/packages/fss/transport/ReplayEngine');
const QuarantineCircuitBreaker = require('../ppos-shared-infra/packages/fss/recovery/QuarantineCircuitBreaker');
const FederatedHealthService = require('../ppos-shared-infra/packages/fss/recovery/FederatedHealthService');

// Mock Redis
class MockRedis {
    constructor() { this.store = new Map(); }
    async get(k) { return this.store.get(k); }
    async set(k, v) { this.store.set(k, v); return 'OK'; }
    async incr(k) { 
        const val = (parseInt(this.store.get(k)) || 0) + 1;
        this.store.set(k, val.toString());
        return val;
    }
    async expire(k, t) {}
    async del(k) { this.store.delete(k); }
    async keys(p) { return Array.from(this.store.keys()).filter(k => k.startsWith(p.replace('*', ''))); }
}

async function runTests() {
    console.log('🚀 Starting V1.9.0 Federated Recovery Test Suite...\n');
    const results = [];
    const redis = new MockRedis();
    const TEST_REGION = 'EU-PPOS-1';
    process.env.PPOS_REGION_ID = TEST_REGION;

    // TC-01: Replay Checkpoint Persistence
    try {
        const store = new ReplayCheckpointStore(redis);
        await store.setCheckpoint(TEST_REGION, 'tenant', { last_applied_event_id: 'evt-100', last_applied_version: 5 });
        const cp = await store.getCheckpoint(TEST_REGION, 'tenant');
        
        if (cp && cp.last_applied_event_id === 'evt-100') {
            results.push({ name: 'TC-01: Checkpoint Persistence', status: 'PASS' });
        } else {
            throw new Error('Checkpoint not retrieved correctly');
        }
    } catch (e) {
        results.push({ name: 'TC-01: Checkpoint Persistence', status: 'FAIL', reason: e.message });
    }

    // TC-02: Replay Engine Resume Logic
    try {
        const mockApplier = { apply: async (ev) => console.log('Applying:', ev.event_id) };
        const mockInbox = {
            getEventsAfter: async (id, domain) => {
                const all = [
                    { event_id: 'evt-101', domain: 'tenant', version: 6 },
                    { event_id: 'evt-102', domain: 'tenant', version: 7 }
                ];
                return id === 'evt-100' ? all : [];
            }
        };
        const cpStore = new ReplayCheckpointStore(redis);
        const engine = new ReplayEngine(mockApplier, cpStore, mockInbox);
        
        const count = await engine.runIncremental('tenant');
        const updatedCp = await cpStore.getCheckpoint('EU-PPOS-1', 'tenant');

        if (count === 2 && updatedCp.last_applied_event_id === 'evt-102') {
            results.push({ name: 'TC-02: Replay Engine Resume', status: 'PASS' });
        } else {
            throw new Error(`Expected 2 events, got ${count}. Last event: ${updatedCp?.last_applied_event_id}`);
        }
    } catch (e) {
        results.push({ name: 'TC-02: Replay Engine Resume', status: 'FAIL', reason: e.message });
    }

    // TC-03: Quarantine Circuit Breaker
    try {
        const cb = new QuarantineCircuitBreaker(redis, { threshold: 3 });
        await cb.recordFailure('entity-bad', 'timeout');
        await cb.recordFailure('entity-bad', 'timeout');
        const tripped = await cb.recordFailure('entity-bad', 'timeout');
        
        const state = await cb.isBlackholed('entity-bad');
        
        if (tripped && state && state.status === 'BLACKHOLED') {
            results.push({ name: 'TC-03: Circuit Breaker Blackhole', status: 'PASS' });
        } else {
            throw new Error('Circuit breaker did not trip as expected');
        }
    } catch (e) {
        results.push({ name: 'TC-03: Circuit Breaker Blackhole', status: 'FAIL', reason: e.message });
    }

    // TC-04: Federated Health Aggregation
    try {
        const fhs = new FederatedHealthService({
            redis,
            checkpointStore: new ReplayCheckpointStore(redis),
            inboxStore: {}
        });
        
        // Mock some data in redis
        await redis.set('ppos:fss:quarantine:count:EU-PPOS-1', '5');
        await redis.set('ppos:fss:version:EU-PPOS-1', '1000');
        
        const report = await fhs.getHealthReport();
        
        if (report.metrics.quarantine_backlog === 5 && report.metrics.last_applied_version === 1000) {
            results.push({ name: 'TC-04: Federated Health Aggregation', status: 'PASS' });
        } else {
            throw new Error('Health report metrics incorrect');
        }
    } catch (e) {
        results.push({ name: 'TC-04: Federated Health Aggregation', status: 'FAIL', reason: e.message });
    }

    console.table(results);
    const failures = results.filter(r => r.status === 'FAIL');
    process.exit(failures.length > 0 ? 1 : 0);
}

runTests().catch(console.error);
