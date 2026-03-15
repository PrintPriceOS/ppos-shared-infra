/**
 * @ppos/shared-infra - RegionalReplicationReceiver
 * 
 * High-level coordinator for verifying and storing incoming federated events.
 */
const EventSigner = require('./EventSigner');
const InboxStore = require('./InboxStore');
const path = require('path');
const fs = require('fs');

class RegionalReplicationReceiver {
    constructor(config) {
        this.trustRegistry = config.trustRegistry; // Map of region_id -> public_key
        this.quarantineDir = path.join(process.cwd(), '.runtime', 'fss-quarantine');
        if (!fs.existsSync(this.quarantineDir)) {
            fs.mkdirSync(this.quarantineDir, { recursive: true });
        }
    }

    async receive(envelope) {
        const { origin_region, event_id, signature } = envelope;

        console.log(`[FSS-RECEIVE] Incoming event ${event_id} from ${origin_region}`);

        // 1. Authenticate Origin
        const publicKey = this.trustRegistry[origin_region];
        if (!publicKey) {
            console.warn(`[FSS-SECURITY] Unknown origin region: ${origin_region}`);
            return { status: 'REJECTED', reason: 'UNKNOWN_ORIGIN' };
        }

        // 2. Verify Signature
        try {
            const isValid = EventSigner.verify(envelope, publicKey);
            if (!isValid) {
                console.error(`[FSS-SECURITY] Signature check FAILED for ${event_id}`);
                this.quarantine(envelope, 'INVALID_SIGNATURE');
                return { status: 'QUARANTINED', reason: 'INVALID_SIGNATURE' };
            }
        } catch (err) {
            console.error(`[FSS-SECURITY] Verification error: ${err.message}`);
            this.quarantine(envelope, 'VERIFICATION_ERROR');
            return { status: 'QUARANTINED', reason: 'VERIFICATION_ERROR' };
        }

        // 3. Replay Protection (Dedupe)
        const storeResult = await InboxStore.store(envelope);
        
        return { status: storeResult.status };
    }

    quarantine(envelope, reason) {
        const filePath = path.join(this.quarantineDir, `${envelope.event_id}.json`);
        const report = {
            quarantine_reason: reason,
            quarantined_at: new Date().toISOString(),
            envelope
        };
        fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    }
}

module.exports = RegionalReplicationReceiver;
