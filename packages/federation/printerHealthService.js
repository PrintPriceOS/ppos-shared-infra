// ppos-shared-infra/packages/federation/printerHealthService.js
const db = require('../data/db');
const redis = require('../data/redis');
const { v4: uuidv4 } = require('uuid');

/**
 * PrinterHealthService & CircuitBreaker (Phase 23.F)
 * Monitors node health and manages the isolation of degraded printers.
 */
class PrinterHealthService {
    /**
     * Evaluate and update health for all active printers
     */
    static async evaluateNetworkHealth() {
        const { rows: printers } = await db.query('SELECT id, printer_code FROM printer_nodes WHERE status != "suspended"');
        
        for (const printer of printers) {
            await this.evaluatePrinter(printer.id);
        }
    }

    /**
     * Evaluate a single printer's health and trigger breakers if needed
     */
    static async evaluatePrinter(printerId) {
        const { rows } = await db.query('SELECT * FROM printer_runtime_status WHERE printer_id = ?', [printerId]);
        const status = rows[0];

        if (!status) return;

        // 1. Heartbeat Check
        const lastHeartbeat = status.heartbeat_at ? new Date(status.heartbeat_at).getTime() : 0;
        const now = Date.now();
        const diffSecs = (now - lastHeartbeat) / 1000;

        let availabilityState = 'available';
        if (diffSecs > 300) availabilityState = 'offline';
        else if (diffSecs > 120) availabilityState = 'degraded';

        // 2. Logic to Open Circuit Breaker (Phase 23.F.2)
        const shouldOpenBreaker = (availabilityState === 'offline') || (status.failure_rate_24h > 20);
        
        if (shouldOpenBreaker) {
            await this.openBreaker(printerId, availabilityState === 'offline' ? 'HEARTBEAT_TIMEOUT' : 'HIGH_FAILURE_RATE');
            availabilityState = 'suspended';
        }

        // 3. Update status projection
        await db.query(`
            UPDATE printer_runtime_status 
            SET availability_state = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE printer_id = ?
        `, [availabilityState, printerId]);
    }

    /**
     * Open Circuit Breaker
     */
    static async openBreaker(printerId, reason) {
        // Log SLA Event
        await db.query(`
            INSERT INTO printer_sla_events (id, printer_id, event_type, severity, details)
            VALUES (?, ?, 'breaker_open', 'critical', ?)
        `, [uuidv4(), printerId, JSON.stringify({ reason, timestamp: new Date() })]);

        // Mark node as degraded/suspended in registry to block matchmaking
        await db.query('UPDATE printer_nodes SET status = "degraded" WHERE id = ?', [printerId]);
        
        // Cache breaker state in Redis for fast matching bypass
        await redis.set(`ppos:breaker:${printerId}`, 'open', 'EX', 3600);
    }

    /**
     * Close Circuit Breaker (Recovery)
     */
    static async closeBreaker(printerId) {
        await db.query('UPDATE printer_nodes SET status = "active" WHERE id = ?', [printerId]);
        await redis.del(`ppos:breaker:${printerId}`);
        
        await db.query(`
            INSERT INTO printer_sla_events (id, printer_id, event_type, severity, details)
            VALUES (?, ?, 'breaker_closed', 'info', ?)
        `, [uuidv4(), printerId, JSON.stringify({ action: 'recovery', timestamp: new Date() })]);
    }
}

module.exports = PrinterHealthService;
