const db = require('./db');
const PolicyEnforcementService = require('./policyEnforcementService');
const { v4: uuidv4 } = require('uuid');

class GovernanceService {
    static async quarantineTenant(tenantId, operator, reason) {
        const id = uuidv4();
        const sql = `
            INSERT INTO governance_policies (id, policy_type, scope_type, scope_id, action, status, reason, created_by)
            VALUES (?, 'TENANT_QUARANTINE', 'tenant', ?, 'quarantine', 'active', ?, ?)
            ON DUPLICATE KEY UPDATE status = 'active', reason = ?, created_by = ?
        `;
        
        await db.query(sql, [id, tenantId, reason, operator.id, reason, operator.id]);
        
        PolicyEnforcementService.invalidateCache();
        await this.logAction(operator, 'QUARANTINE_TENANT', 'tenant', tenantId, reason);
        return { success: true, tenantId, status: 'QUARANTINED' };
    }

    static async pardonTenant(tenantId, operator, reason) {
        const sql = `UPDATE governance_policies SET status = 'inactive' WHERE scope_type = 'tenant' AND scope_id = ? AND policy_type = 'TENANT_QUARANTINE'`;
        await db.query(sql, [tenantId]);
        
        PolicyEnforcementService.invalidateCache();
        await this.logAction(operator, 'PARDON_TENANT', 'tenant', tenantId, reason);
        return { success: true, tenantId, status: 'ACTIVE' };
    }

    static async setQueueState(queueName, operator, state, reason) {
        // 'state' could be 'PAUSED' or 'RUNNING'
        const id = uuidv4();
        const status = state === 'PAUSED' ? 'active' : 'inactive';
        
        const sql = `
            INSERT INTO governance_policies (id, policy_type, scope_type, scope_id, action, status, reason, created_by)
            VALUES (?, 'QUEUE_PAUSE', 'queue', ?, 'deny', ?, ?, ?)
            ON DUPLICATE KEY UPDATE status = ?, reason = ?, created_by = ?
        `;
        
        await db.query(sql, [id, queueName, status, reason, operator.id, status, reason, operator.id]);
        
        PolicyEnforcementService.invalidateCache();
        await this.logAction(operator, `QUEUE_${state}`, 'queue', queueName, reason);
        return { success: true, queueName, state };
    }

    static async logAction(operator, actionType, targetType, targetId, reason, payload = {}) {
        const sql = `
            INSERT INTO governance_audit (operator_id, operator_role, action_type, target_type, target_id, reason, payload)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(sql, [
            operator.id || operator.sub,
            operator.role,
            actionType,
            targetType,
            targetId,
            reason,
            JSON.stringify(payload)
        ]);
    }

    static async getAuditLogs(limit = 100) {
        const sql = `SELECT * FROM governance_audit ORDER BY created_at DESC LIMIT ?`;
        const { rows } = await db.query(sql, [limit]);
        return rows;
    }

    static async getActivePolicies() {
        const sql = `SELECT * FROM governance_policies WHERE status = 'active'`;
        const { rows } = await db.query(sql);
        return rows;
    }

    // --- Destructive Actions (19.B.2) ---

    static async flushQueue(queueType, operator, reason) {
        if (operator.role !== 'super-admin') {
            throw new Error('Action restricted to super-admin identity');
        }

        const sql = `DELETE FROM jobs WHERE type = ? AND status IN ('PENDING', 'RUNNING', 'QUEUED')`;
        const { rows } = await db.query(sql, [queueType]);
        
        await this.logAction(operator, 'FLUSH_QUEUE', 'queue', queueType, reason, { 
            destructive: true, 
            affected_rows_approx: rows.affectedRows 
        });
        
        return { success: true, queueType, message: 'Queue flushed successfully' };
    }

    static async purgeJobHistory(days, operator, reason) {
        if (operator.role !== 'super-admin') {
            throw new Error('Action restricted to super-admin identity');
        }

        const sql = `DELETE FROM jobs WHERE created_at < NOW() - INTERVAL ? DAY AND status IN ('SUCCEEDED', 'FAILED')`;
        const { rows } = await db.query(sql, [days]);

        await this.logAction(operator, 'PURGE_HISTORY', 'system', 'global', reason, { 
            destructive: true, 
            days_purged: days,
            affected_rows_approx: rows.affectedRows
        });

        return { success: true, days, message: 'Job history purged successfully' };
    }

    // --- SLO Monitoring (Phase 21.D) ---

    static async getSLOStatus() {
        // Read from Redis cached state (populated by Governance Manager / SLOEvaluationService)
        const redis = require('./redis'); // Assuming redis helper exists here or similar
        const results = await redis.get('ppos:slo:results');
        const globalState = await redis.get('ppos:slo:global_state');

        return {
            globalState: globalState || 'HEALTHY',
            results: results ? JSON.parse(results) : [],
            updatedAt: new Date().toISOString()
        };
    }

    static async getSLOHistory(limit = 50) {
        // Retrieve historical SLO breaches and mitigations from audit logs
        const sql = `
            SELECT * FROM governance_audit 
            WHERE action_type IN ('SLO_BREACH_DETECTED', 'AUTO_MITIGATION_APPLIED', 'AUTO_MITIGATION_REVERTED')
            ORDER BY created_at DESC 
            LIMIT ?
        `;
        const { rows } = await db.query(sql, [limit]);
        return rows;
    }
}

module.exports = GovernanceService;
