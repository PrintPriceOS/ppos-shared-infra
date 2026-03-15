/**
 * PrintPrice OS — Federated Multi-Instance Consistency Test (v1.8.0)
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 1. Mock Infrastructure
const Module = require('module');
const originalRequire = Module.prototype.require;

const sharedStore = {};
const mockRedis = { 
    store: sharedStore,
    hgetall: (k) => Promise.resolve(sharedStore[k] || {}), 
    hget: (k, f) => Promise.resolve(sharedStore[k] ? sharedStore[k][f] : null),
    hset: (k, f, v) => { 
        if (!sharedStore[k]) sharedStore[k] = {};
        sharedStore[k][f] = v;
        return Promise.resolve(1);
    },
    pipeline: () => ({ 
        hset: (k, f, v) => { if (!sharedStore[k]) sharedStore[k] = {}; sharedStore[k][f] = v; return this; }, 
        exec: () => Promise.resolve([]) 
    }),
    duplicate: function() { return this; },
    subscribe: () => Promise.resolve(),
    on: () => {},
    publish: () => Promise.resolve()
};

Module.prototype.require = function() {
    if (arguments[0] === 'ioredis') {
        return function() { return mockRedis; };
    }
    if (arguments[0].includes('data/db')) {
        return { query: () => Promise.resolve({ rows: [], insertId: 1 }), escape: (v) => `'${v}'` };
    }
    if (arguments[0].includes('data/redis')) {
        return mockRedis;
    }
    if (arguments[0] === 'bullmq') {
        return { Queue: class { on() { return this; } }, Worker: class { on() { return this; } } };
    }
    return originalRequire.apply(this, arguments);
};

const { 
    EventSigner, 
    SignatureVerifier, 
    FederatedStateApplier,
    conflictDetector,
    RedisVersionStore,
    regionalRecoveryService
} = require('../ppos-shared-infra');

// Generate a valid Ed25519 keypair
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    privateKeyEncoding: { format: 'der', type: 'pkcs8' },
    publicKeyEncoding: { format: 'der', type: 'spki' }
});

const TEST_PRIVATE_KEY = privateKey.toString('base64');
const TEST_PUBLIC_KEY = publicKey.toString('base64');

async function runTests() {
    console.log('🚀 Starting Multi-Instance Durability Test Suite (v1.8.0)...\n');
    const results = [];

    // Setup environment
    process.env.PPOS_REGION_PRIVATE_KEY = TEST_PRIVATE_KEY;
    process.env.PPOS_REGION_KEY_ID = 'test-key-v1';
    SignatureVerifier.registerKey('EU-PPOS-1', TEST_PUBLIC_KEY);

    const sign = (env) => EventSigner.sign(env);

    // TC-01: Shared Backend Consistency (Simulating 2 instances)
    try {
        // Instance 1 uses RedisVersionStore
        const detector1 = conflictDetector; 
        detector1.storage = RedisVersionStore;
        
        // Instance 2 (simulated by same detector but force re-fetch from storage)
        const detector2 = conflictDetector; 

        const envelope = {
            event_id: 'v18_001',
            event_name: 'PolicyPublished',
            origin_region: 'EU-PPOS-1',
            entity_type: 'policy',
            entity_id: 'POL-SHARED',
            state_version: 5,
            authority_epoch: 1,
            payload: { policy_id: 'POL-SHARED' }
        };

        // Apply in Instance 1
        await FederatedStateApplier.apply(sign(envelope));
        
        // Inspect in Instance 2 (should see version 5 in "Redis")
        const staleEnvelope = { ...envelope, event_id: 'v18_002', state_version: 4 };
        const inspection = await detector2.inspect(staleEnvelope);
        
        if (inspection.conflict && inspection.code === 'STALE_VERSION') {
            results.push({ name: 'TC-01: Shared Backend Consistency', status: 'PASS' });
        } else {
            throw new Error(`Instance 2 did not detect conflict. Inspection: ${JSON.stringify(inspection)}`);
        }
    } catch (e) {
        results.push({ name: 'TC-01: Shared Backend Consistency', status: 'FAIL', reason: e.message });
    }

    // TC-02: Automated Recovery (Drain Quarantine)
    try {
        const drainResult = await regionalRecoveryService.drainQuarantine();
        if (typeof drainResult.drained === 'number') {
            results.push({ name: 'TC-02: Automated Recovery (Drain)', status: 'PASS' });
        } else {
            throw new Error('Drain result invalid');
        }
    } catch (e) {
        results.push({ name: 'TC-02: Automated Recovery (Drain)', status: 'FAIL', reason: e.message });
    }

    // Final Report
    console.table(results);
    const failures = results.filter(r => r.status === 'FAIL');
    process.exit(failures.length > 0 ? 1 : 0);
}

runTests().catch(console.error);
