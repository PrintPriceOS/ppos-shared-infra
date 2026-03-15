const fs = require('fs');
const path = require('path');

/**
 * ConvergenceLedger (Phase v1.6.0)
 * 
 * Records the deterministic outcome of federated event application attempts.
 * This serves as the source of truth for regional state consistency audits.
 */
class ConvergenceLedger {
    constructor() {
        this.ledgerDir = path.join(process.cwd(), '.runtime', 'fss-convergence');
        this.ledgerPath = path.join(this.ledgerDir, 'ledger.jsonl');
        
        if (!fs.existsSync(this.ledgerDir)) {
            fs.mkdirSync(this.ledgerDir, { recursive: true });
        }
    }

    /**
     * Records a successful state transition.
     */
    async recordApplied(envelope, result = {}) {
        await this.append('APPLIED', envelope, result);
    }

    /**
     * Records a rejected event (due to conflict, auth, or schema).
     */
    async recordRejected(envelope, reason, details = {}) {
        await this.append('REJECTED', envelope, { reason, ...details });
    }

    /**
     * Records an event moved to quarantine for later inspection.
     */
    async recordQuarantined(envelope, reason) {
        await this.append('QUARANTINED', envelope, { reason });
    }

    /**
     * Records a replayed event application.
     */
    async recordReplayed(envelope, result = {}) {
        await this.append('REPLAYED', envelope, result);
    }

    async append(status, envelope, metadata) {
        const entry = {
            fss_event_id: envelope.event_id,
            fss_event_name: envelope.event_name,
            origin_region: envelope.origin_region,
            status,
            applied_at: new Date().toISOString(),
            authority_epoch: envelope.authority_epoch || 0,
            state_version: envelope.state_version || 0,
            payload_hash: envelope.payload_hash || 'unknown',
            metadata
        };

        fs.appendFileSync(this.ledgerPath, JSON.stringify(entry) + '\n');
    }

    /**
     * Returns the last recorded status of an event.
     */
    getEventStatus(eventId) {
        // In production, use an index for performance.
        // For MVP/Phase 6, we'll assume a local index or scan.
        return null; 
    }
}

module.exports = new ConvergenceLedger();
