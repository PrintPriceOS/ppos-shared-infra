// ppos-shared-infra/packages/federation/productionStateService.js
const db = require('../data/db');
const { v4: uuidv4 } = require('uuid');

/**
 * ProductionStateService (Phase 23.E)
 * Manages normalized production lifecycle events and projections.
 */
class ProductionStateService {
    /**
     * Define Valid Transitions (The Source of Truth for Workflow)
     */
    static get TRANSITION_MAP() {
        return {
            'ACCEPTED': ['RECEIVED_BY_PRINTER', 'FAILED', 'CANCELLED'],
            'RECEIVED_BY_PRINTER': ['QUEUED_AT_PRINTER', 'FAILED', 'ON_HOLD'],
            'QUEUED_AT_PRINTER': ['PRINTING', 'FAILED', 'ON_HOLD', 'CANCELLED'],
            'PRINTING': ['POSTPROCESSING', 'FAILED', 'ON_HOLD'],
            'POSTPROCESSING': ['READY_TO_SHIP', 'FAILED', 'ON_HOLD'],
            'READY_TO_SHIP': ['SHIPPED', 'COMPLETED', 'FAILED'],
            'SHIPPED': ['COMPLETED', 'FAILED'],
            'ON_HOLD': ['QUEUED_AT_PRINTER', 'PRINTING', 'FAILED', 'CANCELLED'],
            'FAILED': ['REDISPATCH_PENDING'],
            'REDISPATCH_PENDING': [] // Terminal for this specific dispatch
        };
    }

    /**
     * Perform a state transition
     */
    static async transition(params) {
        const { jobId, dispatchId, printerId, newState, source, reason, payload } = params;

        // 1. Get Current State
        const currentState = await this.getCurrentState(dispatchId);
        const currentStatus = currentState ? currentState.current_state : 'ACCEPTED';

        // 2. Validate Transition
        if (!this.isValidTransition(currentStatus, newState)) {
            throw new Error(`Invalid transition: ${currentStatus} -> ${newState}`);
        }

        // 3. Update Ledger (Immutable event log)
        const eventId = uuidv4();
        await db.query(`
            INSERT INTO production_state_events (
                id, job_id, dispatch_id, printer_id, previous_state, new_state, source, reason, payload
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            eventId, jobId, dispatchId, printerId, currentStatus, newState, source, reason, JSON.stringify(payload || {})
        ]);

        // 4. Update Projection (Current state lookup table)
        await db.query(`
            INSERT INTO production_current_state (
                dispatch_id, job_id, printer_id, current_state, last_source, metadata, state_updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE 
                current_state = VALUES(current_state),
                last_source = VALUES(last_source),
                metadata = VALUES(metadata),
                state_updated_at = CURRENT_TIMESTAMP
        `, [
            dispatchId, jobId, printerId, newState, source, JSON.stringify(payload || {})
        ]);

        // 5. Update the master dispatch record status (Phase 23.D link)
        await db.query('UPDATE federated_dispatches SET dispatch_status = ? WHERE id = ?', [newState.toLowerCase(), dispatchId]);

        return { success: true, eventId };
    }

    /**
     * Check if a transition is allowed
     */
    static isValidTransition(current, next) {
        if (current === next) return true; // No-op allowed
        const allowed = this.TRANSITION_MAP[current] || [];
        return allowed.includes(next);
    }

    /**
     * Get real-time status of a dispatch
     */
    static async getCurrentState(dispatchId) {
        const { rows } = await db.query('SELECT * FROM production_current_state WHERE dispatch_id = ?', [dispatchId]);
        return rows[0] || null;
    }

    /**
     * Get full audit history for a job/dispatch
     */
    static async getStateHistory(dispatchId) {
        const { rows } = await db.query(`
            SELECT * FROM production_state_events 
            WHERE dispatch_id = ? 
            ORDER BY created_at ASC
        `, [dispatchId]);
        return rows;
    }
}

module.exports = ProductionStateService;
