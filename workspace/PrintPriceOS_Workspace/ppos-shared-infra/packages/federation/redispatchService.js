// ppos-shared-infra/packages/federation/redispatchService.js
const db = require('../data/db');
const { v4: uuidv4 } = require('uuid');
const FederatedMatchmakerService = require('./federatedMatchmakerService');
const DispatchOfferService = require('./dispatchOfferService');

/**
 * RedispatchService (Phase 23.F.4)
 * Automates job recovery when dispatches fail or stall.
 */
class RedispatchService {
    /**
     * Trigger a redispatch for a failed or stalled job
     */
    static async triggerRedispatch(jobId, failedDispatchId, reasonCode) {
        // 1. Check attempt limits
        const { rows: attempts } = await db.query('SELECT MAX(attempt_number) as last_attempt FROM redispatch_attempts WHERE job_id = ?', [jobId]);
        const attemptNumber = (attempts[0].last_attempt || 0) + 1;

        if (attemptNumber > 3) {
            console.log(`[REDISPATCH] Max attempts reached for job ${jobId}. Blocking auto-recovery.`);
            await this.logAttempt(jobId, failedDispatchId, reasonCode, attemptNumber, 'blocked');
            return false;
        }

        console.log(`[REDISPATCH] Attempt ${attemptNumber} for job ${jobId}. Reason: ${reasonCode}`);

        // 2. Fetch Job Data for Re-matching
        const { rows: jobs } = await db.query('SELECT data FROM jobs WHERE id = ?', [jobId]);
        if (jobs.length === 0) return false;

        // 3. Find New Candidates (Excluding previous printer if possible)
        const candidates = await FederatedMatchmakerService.findBestCandidates(jobs[0].data);
        const filteredCandidates = candidates.filter(c => c.printerId !== (failedDispatchId ? failedDispatchId.printer_id : null));

        if (filteredCandidates.length === 0) {
            await this.logAttempt(jobId, failedDispatchId, reasonCode, attemptNumber, 'skipped', { error: 'No other compatible candidates' });
            return false;
        }

        // 4. Create New Offer
        const nextCandidate = filteredCandidates[0];
        const newOfferId = await DispatchOfferService.createOffer(jobId, nextCandidate);

        // 5. Link in metadata for traceability
        await db.query(`
            UPDATE federated_dispatches 
            SET attempt_number = ?, parent_dispatch_id = ? 
            WHERE id = ?
        `, [attemptNumber, failedDispatchId, newOfferId]);

        await this.logAttempt(jobId, failedDispatchId, reasonCode, attemptNumber, 'completed', { newOfferId, printerId: nextCandidate.printerId });

        return true;
    }

    static async logAttempt(jobId, failedDispatchId, reasonCode, attemptNumber, status, metadata = {}) {
        await db.query(`
            INSERT INTO redispatch_attempts (id, job_id, failed_dispatch_id, reason_code, attempt_number, status, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [uuidv4(), jobId, failedDispatchId, reasonCode, attemptNumber, status, JSON.stringify(metadata)]);
    }

    /**
     * Background Task: Detect expired offers and trigger redispatch
     */
    static async processExpiredOffers() {
        const { rows: expired } = await db.query(`
            SELECT id, job_id, printer_id FROM federated_dispatches 
            WHERE dispatch_status = 'offered' AND offer_expires_at <= CURRENT_TIMESTAMP
        `);

        for (const offer of expired) {
            // Mark as expired
            await db.query('UPDATE federated_dispatches SET dispatch_status = "expired", expired_at = CURRENT_TIMESTAMP WHERE id = ?', [offer.id]);
            
            // Trigger Redispatch
            await this.triggerRedispatch(offer.job_id, offer.id, 'OFFER_EXPIRED');
        }
    }
}

/**
 * FederatedSLAService (Phase 23.F.3)
 */
class FederatedSLAService {
    /**
     * Detect stuck jobs based on dwell time per state
     */
    static async checkStuckJobs() {
        // Example: Jobs stuck in RECEIVED_BY_PRINTER for more than 4 hours
        const { rows: stuck } = await db.query(`
            SELECT dispatch_id, job_id, current_state FROM production_current_state
            WHERE current_state = 'RECEIVED_BY_PRINTER' 
            AND state_updated_at < DATE_SUB(NOW(), INTERVAL 4 HOUR)
        `);

        for (const job of stuck) {
            await db.query(`
                INSERT INTO printer_sla_events (id, printer_id, dispatch_id, event_type, severity, details)
                SELECT ?, printer_id, ?, 'sla_breach', 'warning', ? FROM production_current_state WHERE dispatch_id = ?
            `, [uuidv4(), job.dispatch_id, JSON.stringify({ state: job.current_state, reason: 'DWELL_TIME_EXCEEDED' }), job.dispatch_id]);
            
            // For severe stalls, we might trigger redispatch, but v1 is just notification/warning.
        }
    }
}

module.exports = { RedispatchService, FederatedSLAService };
