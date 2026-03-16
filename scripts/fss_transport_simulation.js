/**
 * FSS Transport End-to-End Simulation
 * 
 * Simulates EU and US regions synchronizing state.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 1. Setup Mock Identities
const { publicKey: euPublic, privateKey: euPrivate } = crypto.generateKeyPairSync('ed25519');
const { publicKey: usPublic, privateKey: usPrivate } = crypto.generateKeyPairSync('ed25519');

const EU_PUB_PEM = euPublic.export({ type: 'spki', format: 'pem' });
const EU_PRIV_PEM = euPrivate.export({ type: 'pkcs8', format: 'pem' });
const US_PUB_PEM = usPublic.export({ type: 'spki', format: 'pem' });
const US_PRIV_PEM = usPrivate.export({ type: 'pkcs8', format: 'pem' });

const EventSigner = require('./ppos-shared-infra/packages/fss/transport/EventSigner');
const OutboxRelay = require('./ppos-shared-infra/packages/fss/transport/OutboxRelay');
const RegionalReplicationReceiver = require('./ppos-shared-infra/packages/fss/transport/RegionalReplicationReceiver');
const ReplicationApplier = require('./ppos-shared-infra/packages/fss/transport/ReplicationApplier');
const ReplayEngine = require('./ppos-shared-infra/packages/fss/transport/ReplayEngine');

async function runSimulation() {
    console.log('--- STARTING FSS TRANSPORT SIMULATION ---');

    // Setup EU Outbox
    const euOutboxDir = path.join(process.cwd(), '.runtime', 'fss-outbox');
    if (!fs.existsSync(euOutboxDir)) fs.mkdirSync(euOutboxDir, { recursive: true });
    const euOutboxPath = path.join(euOutboxDir, 'events.jsonl');
    fs.writeFileSync(euOutboxPath, ''); // Reset

    // EU emits a policy event
    const policyEvent = {
        event_id: 'evt-001',
        event_name: 'PolicyPublished',
        origin_region: 'EU-PPOS-1',
        entity_type: 'governance_policy',
        entity_id: 'policy-r13',
        payload: { id: 'policy-r13', name: 'Global Lockdown' }
    };
    fs.appendFileSync(euOutboxPath, JSON.stringify(policyEvent) + '\n');

    // Setup US Receiver
    const usReceiver = new RegionalReplicationReceiver({
        trustRegistry: {
            'EU-PPOS-1': EU_PUB_PEM
        }
    });

    // 2. Simulate Relay Push (Manual)
    console.log('\n[1] EU Relay signing and pushing to US...');
    const signedByEU = EventSigner.sign(policyEvent, EU_PRIV_PEM);
    console.log('Signed Envelope:', !!signedByEU.signature);

    // 3. US Receives
    console.log('\n[2] US Receiving Event...');
    const result = await usReceiver.receive(signedByEU);
    console.log('US Result Status:', result.status);

    if (result.status === 'ACCEPTED') {
        console.log('✅ PASS: US accepted signed EU event.');
    }

    // 4. Simulate Malicious Injection (Bad Signature)
    console.log('\n[3] Simulating Malicious Injection (Bad Signature)...');
    const forgedEvent = { ...signedByEU, signature: 'FORGED_SIG' };
    const forgedResult = await usReceiver.receive(forgedEvent);
    console.log('Forged Result Status:', forgedResult.status);
    if (forgedResult.status === 'QUARANTINED') {
        console.log('✅ PASS: US quarantined forged event.');
    }

    // 5. Application Test
    console.log('\n[4] US Replay Engine applying state...');
    const applier = new ReplicationApplier({}, {});
    const replay = new ReplayEngine(applier);
    await replay.run();
    
    console.log('\n--- SIMULATION COMPLETED ---');
}

runSimulation().catch(console.error);
