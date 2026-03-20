/**
 * @ppos/shared-infra - RegionalReplicationReceiver
 * 
 * High-level coordinator for verifying and storing incoming federated events.
 */
const signatureVerifier = require('../SignatureVerifier');
const federatedAuth = require('../FederatedAuthorizationService');
const InboxStore = require('./InboxStore');
const FederatedStateApplier = require('../FederatedStateApplier');
const path = require('path');
const fs = require('fs');
const metricsService = require('../../ops/MetricsService');

class RegionalReplicationReceiver {
    constructor(config = {}) {
        this.quarantineDir = path.join(process.cwd(), '.runtime', 'fss-quarantine');
        if (!fs.existsSync(this.quarantineDir)) {
            fs.mkdirSync(this.quarantineDir, { recursive: true });
        }
    }

    async receive(envelope) {
        const { origin_region, event_id, event_name } = envelope;

        console.log(`[FSS-RECEIVE] Incoming event ${event_id} from ${origin_region}`);

        // 1. Signature Verification (Phase 2)
        const isSignatureValid = signatureVerifier.verify(envelope);
        if (!isSignatureValid) {
            console.error(`[FSS-SECURITY] Signature check FAILED for ${event_id} from ${origin_region}`);
            this.quarantine(envelope, 'INVALID_SIGNATURE');
            metricsService.recordRuntimeDecision('fss_receive_invalid_sig', false, 'NORMAL', origin_region);
            return { status: 'REJECTED_INVALID_SIGNATURE' };
        }

        // 2. Authorization Verification (Phase 6)
        const isAuthorized = federatedAuth.isAuthorized(origin_region, event_name);
        if (!isAuthorized) {
            console.warn(`[FSS-SECURITY] Region ${origin_region} is NOT AUTHORIZED to publish ${event_name}`);
            this.quarantine(envelope, 'UNAUTHORIZED_SENDER');
            metricsService.recordRuntimeDecision('fss_receive_unauthorized', false, 'NORMAL', origin_region);
            return { status: 'REJECTED_UNAUTHORIZED' };
        }

        // 3. Persist and Dedupe (Phase 5)
        const storeResult = await InboxStore.store(envelope);
        
        if (storeResult.status === 'ACCEPTED') {
            metricsService.recordRuntimeDecision('fss_receive_accepted', true, 'NORMAL', origin_region);
            
            // 4. Deterministic Application (Phase v1.6.0)
            const applyResult = await FederatedStateApplier.apply(envelope);
            return { status: applyResult.status };
        }

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
