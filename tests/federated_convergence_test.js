/**
 * PrintPrice OS — Federated State Convergence Test Suite (v1.6.0)
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
    return originalRequire.apply(this, arguments);
};

const { 
    EventSigner, 
    SignatureVerifier, 
    FederatedStateApplier,
    conflictDetector,
    driftInspector,
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
    console.log('🚀 Starting Federated Convergence Test Suite...\n');
    const results = [];

    // Setup environment
    process.env.PPOS_REGION_PRIVATE_KEY = TEST_PRIVATE_KEY;
    process.env.PPOS_REGION_KEY_ID = 'test-key-v1';
    SignatureVerifier.registerKey('EU-PPOS-1', TEST_PUBLIC_KEY);

    // Mock Authority
    PolicyAuthorityResolver.getAuthoritativeRegionId = () => 'EU-PPOS-1';

    // Helper to sign event
    const sign = (env) => EventSigner.sign(env);

    // TC-01: Valid Receive + Apply
    try {
        const envelope = {
            event_id: 'conv_001',
            event_name: 'PolicyPublished',
            origin_region: 'EU-PPOS-1',
            entity_type: 'policy',
            entity_id: 'POL-001',
            state_version: 1,
            authority_epoch: 1,
            payload: { data: 'initial' }
        };

        const result = await FederatedStateApplier.apply(sign(envelope));
        if (result.status === 'APPLIED') {
            results.push({ name: 'TC-01: Valid Receive + Apply', status: 'PASS' });
        } else {
            throw new Error(`Expected APPLIED, got ${result.status}`);
        }
    } catch (e) {
        results.push({ name: 'TC-01: Valid Receive + Apply', status: 'FAIL', reason: e.message });
    }

    // TC-02: Duplicate submission is skipped
    try {
        const envelope = {
            event_id: 'conv_001', // Same ID
            event_name: 'PolicyPublished',
            origin_region: 'EU-PPOS-1',
            entity_type: 'policy',
            entity_id: 'POL-001',
            state_version: 1,
            authority_epoch: 1,
            payload: { data: 'initial' }
        };

        const result = await FederatedStateApplier.apply(sign(envelope));
        if (result.status === 'SKIPPED_DUPLICATE') {
            results.push({ name: 'TC-02: Duplicate submission skipped', status: 'PASS' });
        } else {
            throw new Error(`Expected SKIPPED_DUPLICATE, got ${result.status}`);
        }
    } catch (e) {
        results.push({ name: 'TC-02: Duplicate submission skipped', status: 'FAIL', reason: e.message });
    }

    // TC-03: Stale Version Rejection
    try {
        const envelope = {
            event_id: 'conv_003',
            event_name: 'PolicyPublished',
            origin_region: 'EU-PPOS-1',
            entity_type: 'policy',
            entity_id: 'POL-001',
            state_version: 0, // Stale (current is 1)
            authority_epoch: 1,
            payload: { data: 'stale' }
        };

        const result = await FederatedStateApplier.apply(sign(envelope));
        if (result.status === 'REJECTED_CONFLICT' && result.code === 'STALE_VERSION') {
            results.push({ name: 'TC-03: Stale Version Rejection', status: 'PASS' });
        } else {
            throw new Error(`Expected STALE_VERSION rejection, got ${result.status}`);
        }
    } catch (e) {
        results.push({ name: 'TC-03: Stale Version Rejection', status: 'FAIL', reason: e.message });
    }

    // TC-04: Higher Authority Epoch Wins
    try {
        const envelope = {
            event_id: 'conv_004',
            event_name: 'PolicyPublished',
            origin_region: 'EU-PPOS-1',
            entity_type: 'policy',
            entity_id: 'POL-001',
            state_version: 5, 
            authority_epoch: 2, // New Epoch
            payload: { data: 'epoch-reset' }
        };

        const result = await FederatedStateApplier.apply(sign(envelope));
        if (result.status === 'APPLIED') {
            results.push({ name: 'TC-04: Higher Authority Epoch Wins', status: 'PASS' });
        } else {
            throw new Error(`Expected APPLIED for new epoch, got ${result.status}`);
        }
    } catch (e) {
        results.push({ name: 'TC-04: Higher Authority Epoch Wins', status: 'FAIL', reason: e.message });
    }

    // TC-05: Drift Detection
    try {
        const localDigest = driftInspector.generateStateDigest();
        if (localDigest.state_fingerprint && localDigest.entity_count > 0) {
            // Mock a remote digest with a different fingerprint
            const remoteDigest = { ...localDigest, state_fingerprint: 'different' };
            const drift = driftInspector.inspectDrift(remoteDigest);
            if (drift.has_drift) {
                results.push({ name: 'TC-05: Drift Detection', status: 'PASS' });
            } else {
                throw new Error('Drift not detected');
            }
        } else {
            throw new Error('Failed to generate local digest');
        }
    } catch (e) {
        results.push({ name: 'TC-05: Drift Detection', status: 'FAIL', reason: e.message });
    }

    // Final Report
    console.table(results);
    const failures = results.filter(r => r.status === 'FAIL');
    process.exit(failures.length > 0 ? 1 : 0);
}

runTests().catch(console.error);
