/**
 * PrintPrice OS — Regional Relay & Signed Envelope Test Suite
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
    fssReceiver, 
    OutboxRelay, 
    PolicyAuthorityResolver,
    regionContext
} = require('../ppos-shared-infra');

// Generate a valid Ed25519 keypair for testing
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    privateKeyEncoding: { format: 'der', type: 'pkcs8' },
    publicKeyEncoding: { format: 'der', type: 'spki' }
});

const TEST_PRIVATE_KEY = privateKey.toString('base64');
const TEST_PUBLIC_KEY = publicKey.toString('base64');

async function runTests() {
    console.log('🚀 Starting Federated Relay Test Suite...\n');
    const results = [];

    // Setup environment
    process.env.PPOS_REGION_PRIVATE_KEY = TEST_PRIVATE_KEY;
    process.env.PPOS_REGION_KEY_ID = 'test-key-v1';
    SignatureVerifier.registerKey('EU-PPOS-1', TEST_PUBLIC_KEY);

    // Mock Authority
    PolicyAuthorityResolver.getAuthoritativeRegionId = () => 'EU-PPOS-1';

    // TC-01: Authority region signs and relays PolicyPublished
    try {
        const envelope = {
            event_id: 'evt_001',
            event_name: 'PolicyPublished',
            origin_region: 'EU-PPOS-1',
            payload: { policy_id: 'POL-001' }
        };

        const signed = EventSigner.sign(envelope);
        if (signed.signature && signed.key_id === 'test-key-v1') {
            const result = await fssReceiver.receive(signed);
            if (result.status === 'ACCEPTED') {
                results.push({ name: 'TC-01: Authority signs and receiver accepts', status: 'PASS' });
            } else {
                throw new Error(`Receiver returned status: ${result.status}`);
            }
        } else {
            throw new Error('Signing failed');
        }
    } catch (e) {
        results.push({ name: 'TC-01: Authority signs and receiver accepts', status: 'FAIL', reason: e.message });
    }

    // TC-02: Unsigned envelope is rejected
    try {
        const result = await fssReceiver.receive({ event_id: 'evt_002', origin_region: 'EU-PPOS-1' });
        if (result.status === 'REJECTED_INVALID_SIGNATURE') {
            results.push({ name: 'TC-02: Unsigned envelope is rejected', status: 'PASS' });
        } else {
            throw new Error('Receiver did not reject unsigned envelope');
        }
    } catch (e) {
        results.push({ name: 'TC-02: Unsigned envelope is rejected', status: 'FAIL', reason: e.message });
    }

    // TC-03: Invalid signature is rejected
    try {
        const envelope = { event_id: 'evt_003', event_name: 'PolicyPublished', origin_region: 'EU-PPOS-1', signature: 'invalid-sig' };
        const result = await fssReceiver.receive(envelope);
        if (result.status === 'REJECTED_INVALID_SIGNATURE') {
            results.push({ name: 'TC-03: Invalid signature is rejected', status: 'PASS' });
        } else {
            throw new Error('Receiver accepted invalid signature');
        }
    } catch (e) {
        results.push({ name: 'TC-03: Invalid signature is rejected', status: 'FAIL', reason: e.message });
    }

    // TC-04: Non-authority region trying PolicyPublished is rejected
    try {
        const envelope = {
            event_id: 'evt_004',
            event_name: 'PolicyPublished',
            origin_region: 'US-PPOS-1', // Not the authority
            payload: { policy_id: 'POL-BAD' }
        };
        
        // Register key for US region to pass signature check but fail auth check
        SignatureVerifier.registerKey('US-PPOS-1', TEST_PUBLIC_KEY);
        
        // We need to sign as US-PPOS-1
        const signed = EventSigner.sign(envelope);
        
        const result = await fssReceiver.receive(signed);
        if (result.status === 'REJECTED_UNAUTHORIZED') {
            results.push({ name: 'TC-04: Non-authority publisher is rejected', status: 'PASS' });
        } else {
            throw new Error(`Accepted unauthorized region: ${result.status}`);
        }
    } catch (e) {
        results.push({ name: 'TC-04: Non-authority publisher is rejected', status: 'FAIL', reason: e.message });
    }

    // TC-05: Allowed event from secondary region (RegionHealthSummaryPublished)
    try {
        const envelope = {
            event_id: 'evt_005',
            event_name: 'RegionHealthSummaryPublished',
            origin_region: 'US-PPOS-1',
            payload: { status: 'HEALTHY' }
        };
        const signed = EventSigner.sign(envelope);
        const result = await fssReceiver.receive(signed);
        if (result.status === 'ACCEPTED') {
            results.push({ name: 'TC-05: Secondary region health report accepted', status: 'PASS' });
        } else {
            throw new Error(`Failed to accept valid health report: ${result.status}`);
        }
    } catch (e) {
        results.push({ name: 'TC-05: Secondary region health report accepted', status: 'FAIL', reason: e.message });
    }

    // Final Report
    console.table(results);
    const failures = results.filter(r => r.status === 'FAIL');
    process.exit(failures.length > 0 ? 1 : 0);
}

runTests().catch(console.error);
