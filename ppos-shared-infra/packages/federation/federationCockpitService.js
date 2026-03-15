// ppos-shared-infra/packages/federation/federationCockpitService.js
const db = require('../data/db');

/**
 * FederationCockpitService (Phase 23.G)
 * Aggregates data for operational visibility and manual overrides.
 */
class FederationCockpitService {
    /**
     * Get executive summary of the federated network
     */
    static async getOverview() {
        // 1. Printer Stats
        const { rows: printerStats } = await db.query(`
            SELECT 
                availability_state, 
                COUNT(*) as count 
            FROM printer_runtime_status 
            GROUP BY availability_state
        `);

        // 2. Active Job Stats
        const { rows: jobStats } = await db.query(`
            SELECT 
                current_state, 
                COUNT(*) as count 
            FROM production_current_state 
            GROUP BY current_state
        `);

        // 3. Recent Incidents (24h)
        const { rows: incidents } = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM redispatch_attempts WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)) as redispatches_24h,
                (SELECT COUNT(*) FROM printer_sla_events WHERE severity = 'critical' AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)) as critical_sla_24h
        `);

        return {
            printers: printerStats,
            jobs: jobStats,
            incidents: incidents[0]
        };
    }

    /**
     * Get detailed list of printers with their runtime health
     */
    static async getPrinters() {
        const sql = `
            SELECT 
                n.id, n.printer_code, n.display_name, n.status as registry_status, n.trust_level, n.sla_tier, n.country_code,
                s.availability_state, s.heartbeat_at, s.failure_rate_24h, s.acceptance_rate_24h, s.queue_depth
            FROM printer_nodes n
            JOIN printer_runtime_status s ON n.id = s.printer_id
            ORDER BY s.heartbeat_at DESC
        `;
        const { rows } = await db.query(sql);
        return rows;
    }

    /**
     * Get jobs that are likely stuck or failed
     */
    static async getStuckJobs() {
        const sql = `
            SELECT 
                pcs.*, 
                fd.printer_id, fd.attempt_number,
                TIMESTAMPDIFF(MINUTE, pcs.state_updated_at, NOW()) as dwell_minutes
            FROM production_current_state pcs
            JOIN federated_dispatches fd ON pcs.dispatch_id = fd.id
            WHERE 
                (pcs.current_state = 'ACCEPTED' AND TIMESTAMPDIFF(MINUTE, pcs.state_updated_at, NOW()) > 30) OR
                (pcs.current_state = 'RECEIVED_BY_PRINTER' AND TIMESTAMPDIFF(MINUTE, pcs.state_updated_at, NOW()) > 60) OR
                (pcs.current_state = 'PRINTING' AND TIMESTAMPDIFF(MINUTE, pcs.state_updated_at, NOW()) > 1440)
            ORDER BY dwell_minutes DESC
        `;
        const { rows } = await db.query(sql);
        return rows;
    }

    /**
     * Get full timeline for a specific job dispatch
     */
    static async getJobTimeline(dispatchId) {
        const { rows: events } = await db.query(`
            SELECT * FROM production_state_events 
            WHERE dispatch_id = ? 
            ORDER BY created_at ASC
        `, [dispatchId]);

        const { rows: dispatches } = await db.query(`
            SELECT * FROM federated_dispatches WHERE id = ?
        `, [dispatchId]);

        const { rows: slaEvents } = await db.query(`
            SELECT * FROM printer_sla_events WHERE dispatch_id = ?
            ORDER BY created_at ASC
        `, [dispatchId]);

        return {
            dispatch: dispatches[0],
            events,
            slaEvents
        };
    }
}

module.exports = FederationCockpitService;
