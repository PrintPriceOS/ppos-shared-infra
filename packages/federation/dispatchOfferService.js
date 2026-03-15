// ppos-shared-infra/packages/federation/dispatchOfferService.js
const db = require('../data/db');
const { v4: uuidv4 } = require('uuid');

/**
 * DispatchOfferService (Phase 23.C.4)
 * Manages the lifecycle of federated job offers (OFFERED -> ACCEPTED/REJECTED/EXPIRED).
 */
class DispatchOfferService {
    /**
     * Create a new offer for a printer
     */
    static async createOffer(jobId, candidate, ttlMinutes = 5) {
        const id = uuidv4();
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + ttlMinutes);

        const sql = `
            INSERT INTO federated_dispatches (
                id, job_id, printer_id, dispatch_status, score, score_trace, offer_expires_at
            ) VALUES (?, ?, ?, 'offered', ?, ?, ?)
        `;

        await db.query(sql, [
            id,
            jobId,
            candidate.printerId,
            candidate.finalScore,
            JSON.stringify(candidate.trace),
            expiry
        ]);

        return id;
    }

    /**
     * Accept an offer
     */
    static async acceptOffer(dispatchId) {
        const sql = `
            UPDATE federated_dispatches 
            SET dispatch_status = 'accepted', accepted_at = CURRENT_TIMESTAMP
            WHERE id = ? AND dispatch_status = 'offered' AND offer_expires_at > CURRENT_TIMESTAMP
        `;
        const { rowsAffected } = await db.execute(sql, [dispatchId]);
        return rowsAffected > 0;
    }

    /**
     * Reject an offer
     */
    static async rejectOffer(dispatchId, reason) {
        const sql = `
            UPDATE federated_dispatches 
            SET dispatch_status = 'rejected', rejected_at = CURRENT_TIMESTAMP, failure_reason = ?
            WHERE id = ? AND dispatch_status = 'offered'
        `;
        await db.query(sql, [reason, dispatchId]);
    }

    /**
     * Get active offers for a printer (Polling backend)
     */
    static async getActiveOffers(printerId) {
        const sql = `
            SELECT d.*, j.data as job_data 
            FROM federated_dispatches d
            JOIN jobs j ON d.job_id = j.id
            WHERE d.printer_id = ? 
            AND d.dispatch_status = 'offered' 
            AND d.offer_expires_at > CURRENT_TIMESTAMP
        `;
        const { rows } = await db.query(sql, [printerId]);
        return rows;
    }

    /**
     * Housekeeping: Expire stale offers
     */
    static async expireOffers() {
        const sql = `
            UPDATE federated_dispatches 
            SET dispatch_status = 'expired', expired_at = CURRENT_TIMESTAMP
            WHERE dispatch_status = 'offered' AND offer_expires_at <= CURRENT_TIMESTAMP
        `;
        await db.query(sql);
    }
}

module.exports = DispatchOfferService;
