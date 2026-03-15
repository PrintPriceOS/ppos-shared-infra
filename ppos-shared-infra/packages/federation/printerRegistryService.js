// ppos-shared-infra/packages/federation/printerRegistryService.js
const db = require('../data/db');
const redis = require('../data/redis');
const { v4: uuidv4 } = require('uuid');

/**
 * PrinterRegistryService (Phase 23.A)
 * Manages the taxonomy and registration of federated printer nodes.
 */
class PrinterRegistryService {
    /**
     * Register a new printer node
     */
    static async registerPrinter(printerData) {
        const id = uuidv4();
        const sql = `
            INSERT INTO printer_nodes (
                id, printer_code, display_name, legal_name, country_code, 
                region, city, timezone, connector_type, sla_tier, trust_level
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(sql, [
            id,
            printerData.printer_code,
            printerData.display_name,
            printerData.legal_name,
            printerData.country_code || 'US',
            printerData.region,
            printerData.city,
            printerData.timezone || 'UTC',
            printerData.connector_type || 'pull_agent',
            printerData.sla_tier || 'standard',
            printerData.trust_level || 'verified'
        ]);

        // Initialize Runtime Status
        await db.query('INSERT INTO printer_runtime_status (id, printer_id) VALUES (?, ?)', [uuidv4(), id]);

        return { id, printer_code: printerData.printer_code };
    }

    /**
     * Add technical capability to a printer
     */
    static async addCapability(printerId, cap) {
        const id = uuidv4();
        const sql = `
            INSERT INTO printer_capabilities (id, printer_id, capability_type, capability_key, capability_value, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.query(sql, [
            id,
            printerId,
            cap.type,
            cap.key,
            cap.value,
            JSON.stringify(cap.metadata || {})
        ]);
        return id;
    }

    /**
     * Get a printer with its full capabilities
     */
    static async getPrinter(printerId) {
        const nodeSql = `SELECT * FROM printer_nodes WHERE id = ?`;
        const capSql = `SELECT * FROM printer_capabilities WHERE printer_id = ?`;
        const statusSql = `SELECT * FROM printer_runtime_status WHERE printer_id = ?`;

        const [nodes, caps, status] = await Promise.all([
            db.query(nodeSql, [printerId]),
            db.query(capSql, [printerId]),
            db.query(statusSql, [printerId])
        ]);

        if (nodes.rows.length === 0) return null;

        return {
            ...nodes.rows[0],
            capabilities: caps.rows,
            runtime: status.rows[0]
        };
    }

    /**
     * List printers by capability requirements (Matching Foundation)
     */
    static async findPrintersByCapabilities(requirements = []) {
        if (requirements.length === 0) {
            const { rows } = await db.query('SELECT * FROM printer_nodes WHERE status = "active"');
            return rows;
        }

        // Complex intersection: Printers that have ALL required capabilities
        // This is a simplified version; real matchmaking uses the MatchmakerService (23.C)
        let sql = `
            SELECT n.* FROM printer_nodes n
            WHERE n.status = 'active'
        `;

        for (const req of requirements) {
            sql += `
                AND EXISTS (
                    SELECT 1 FROM printer_capabilities c 
                    WHERE c.printer_id = n.id 
                    AND c.capability_type = ${db.escape(req.type)}
                    AND c.capability_key = ${db.escape(req.key)}
                    AND c.capability_value = ${db.escape(req.value)}
                )
            `;
        }

        const { rows } = await db.query(sql);
        return rows;
    }

    /**
     * Update runtime status (Heartbeat hook)
     */
    static async updateStatus(printerId, update) {
        const sql = `
            UPDATE printer_runtime_status 
            SET 
                availability_state = ?,
                queue_depth = ?,
                heartbeat_at = CURRENT_TIMESTAMP
            WHERE printer_id = ?
        `;
        await db.query(sql, [
            update.state || 'available',
            update.queue_depth || 0,
            printerId
        ]);

        // Publish to Redis for real-time reactivity (Phase 23.F)
        await redis.publish('ppos:federation:health', JSON.stringify({
            printerId,
            state: update.state,
            timestamp: Date.now()
        }));
    }
}

module.exports = PrinterRegistryService;
