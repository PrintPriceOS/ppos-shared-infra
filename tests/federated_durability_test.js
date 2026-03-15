/**
 * PrintPrice OS — Federated Durability & Reducer Test Suite (v1.7.0)
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 1. Mock Infrastructure
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function() {
    if (arguments[0] === 'ioredis') {
        return class MockRedis { on() { return this; } quit() { return Promise.resolve(); } duplicate() { return this; } subscribe() { return Promise.resolve(); } publish() { return Promise.resolve(); } };
    }
    if (arguments[0] === 'bullmq') {
        return { Queue: class { on() { return this; } }, Worker: class { on() { return this; } } };
    }
    if (arguments[0].includes('data/db')) {
        return { query: () => Promise.resolve({ rows: [], insertId: 1 }), escape: (v) => `'${v}'` };
    }
    if (arguments[0].includes('data/redis')) {
        const mockRedis = { 
            publish: () => Promise.resolve(), 
            set: () => Promise.resolve(), 
            get: () => Promise.resolve(),
            duplicate: function() { return this; },
            subscribe: () => Promise.resolve(),
            on: () => {}
        };
        return mockRedis;
    }
    return originalRequire.apply(this, arguments);
};

const { 
    EventSigner, 
    SignatureVerifier, 
    FederatedStateApplier,
    conflictDetector,
    quarantineStore,
    PolicyAuthorityResolver
} = require('../ppos-shared-infra');

// Generate a valid Ed25519 keypair for testing
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    privateKeyEncoding: { format: 'der', type: 'pkcs8' },
    publicKeyEncoding: { format: 'der', type: 'spki' }
});

const TEST_PRIVATE_KEY = privateKey.toString('base64');
const TEST_PUBLIC_KEY = publicKey.toString('base64');

async function runTests() {
    console.log('🚀 Starting Federated Durability & Reducer Test Suite (v1.7.0)...\n');
    const results = [];

    // Clean start
    const vPath = path.join(process.cwd(), '.runtime', 'fss-convergence', 'versions.json');
    if (fs.existsSync(vPath)) fs.unlinkSync(vPath);

    // Setup environment
    process.env.PPOS_REGION_PRIVATE_KEY = TEST_PRIVATE_KEY;
    process.env.PPOS_REGION_KEY_ID = 'test-key-v1';
    SignatureVerifier.registerKey('EU-PPOS-1', TEST_PUBLIC_KEY);

    // Mock Authority
    PolicyAuthorityResolver.getAuthoritativeRegionId = () => 'EU-PPOS-1';

    const sign = (env) => EventSigner.sign(env);

    // TC-01: Reducer Isolation works for PolicyPublished
    try {
        const envelope = {
            event_id: 'v17_001',
            event_name: 'PolicyPublished',
            origin_region: 'EU-PPOS-1',
            entity_type: 'policy',
            entity_id: 'POL-V17',
            state_version: 1,
            authority_epoch: 1,
            payload: { policy_id: 'POL-V17' }
        };

        const result = await FederatedStateApplier.apply(sign(envelope));
        if (result.status === 'APPLIED') {
            results.push({ name: 'TC-01: Isolated Reducer (Policy)', status: 'PASS' });
        } else {
            throw new Error(`Expected APPLIED, got ${result.status} - ${result.error}`);
        }
    } catch (e) {
        results.push({ name: 'TC-01: Isolated Reducer (Policy)', status: 'FAIL', reason: e.message });
    }

    // TC-02: Isolated Reducer for PrinterNodeRegistered
    try {
        const envelope = {
            event_id: 'v17_002',
            event_name: 'PrinterNodeRegistered',
            origin_region: 'EU-PPOS-1',
            entity_type: 'printer',
            entity_id: 'PRN-V17',
            state_version: 1,
            authority_epoch: 1,
            payload: { id: 'PRN-V17', capabilities: ['3d-print'] }
        };

        const result = await FederatedStateApplier.apply(sign(envelope));
        if (result.status === 'APPLIED') {
            results.push({ name: 'TC-02: Isolated Reducer (Printer)', status: 'PASS' });
        } else {
            throw new Error(`Expected APPLIED, got ${result.status} - ${result.error}`);
        }
    } catch (e) {
        results.push({ name: 'TC-02: Isolated Reducer (Printer)', status: 'FAIL', reason: e.message });
    }

    // TC-03: Quarantine lifecycle metadata
    try {
        const envelope = {
            event_id: 'v17_003',
            event_name: 'PolicyPublished',
            origin_region: 'EU-PPOS-1',
            entity_type: 'policy',
            entity_id: 'POL-V17',
            state_version: 0, // STALE VERSION
            authority_epoch: 1,
            payload: { data: 'old' }
        };

        await FederatedStateApplier.apply(sign(envelope));
        const entries = quarantineStore.list();
        const entry = entries.find(e => e.event_id === 'v17_003');
        
        if (entry && entry.reason_code === 'STALE_VERSION' && entry.resolution_status === 'PENDING') {
            results.push({ name: 'TC-03: Quarantine Lifecycle Metadata', status: 'PASS' });
        } else {
            throw new Error(`Invalid quarantine entry: ${JSON.stringify(entry)}`);
        }
    } catch (e) {
        results.push({ name: 'TC-03: Quarantine Lifecycle Metadata', status: 'FAIL', reason: e.message });
    }

    // Final Report
    console.table(results);
    const failures = results.filter(r => r.status === 'FAIL');
    process.exit(failures.length > 0 ? 1 : 0);
}

runTests().catch(console.error);
