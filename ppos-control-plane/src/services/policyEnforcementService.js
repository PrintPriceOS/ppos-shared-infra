// ppos-control-plane/src/services/policyEnforcementService.js
const db = require('./db');
const redis = require('./redis');

// In-memory cache for active policies (19.C.4)
let policyCache = {
    policies: [],
    lastFetch: 0,
    ttl: 10000 // 10 seconds TTL
};

// Initialize Redis Subscriber for instant invalidation (19.C.5)
const sub = redis.duplicate();
sub.subscribe('ppos:governance:policy_updated', (err) => {
    if (err) console.error('[POLICY-ENFORCER] Redis Sub Error:', err);
});

sub.on('message', (channel, message) => {
    if (channel === 'ppos:governance:policy_updated') {
        console.log('[POLICY-ENFORCER] Cache Invalidation Triggered by Broadcast');
        policyCache.lastFetch = 0;
    }
});

class PolicyEnforcementService {
    /**
     * Evaluate governance policies for a specific context
     * @param {Object} context { tenantId, queueName, serviceName, jobType, operation }
     */
    static async evaluate(context) {
        const activePolicies = await this.getActivePolicies();
        
        // 1. Filter policies matching the context
        const matched = activePolicies.filter(p => {
            if (p.status !== 'active') return false;
            
            // Scope Check
            if (p.scope_type === 'global') return true;
            if (p.scope_type === 'tenant' && p.scope_id === context.tenantId) return true;
            if (p.scope_type === 'queue' && p.scope_id === context.queueName) return true;
            if (p.scope_type === 'service' && p.scope_id === context.serviceName) return true;
            
            return false;
        });

        // 2. Deterministic Precedence (19.C.1)
        // Hierarchy: GLOBAL_EXECUTION_HALT > TENANT_LOCK > TENANT_QUARANTINE > JOB_TYPE_DENY > QUEUE_PAUSE > RETRY_SUPPRESS > AI_COST_CAP
        const precedenceMap = {
            'GLOBAL_EXECUTION_HALT': 1,
            'TENANT_LOCK': 2,
            'TENANT_QUARANTINE': 3,
            'JOB_TYPE_DENY': 4,
            'QUEUE_PAUSE': 5,
            'RETRY_SUPPRESS': 6,
            'AI_COST_CAP': 7
        };

        matched.sort((a, b) => (precedenceMap[a.policy_type] || 99) - (precedenceMap[b.policy_type] || 99));

        // 3. Resolve Decision
        // Default: ALLOW
        let decision = {
            allowed: true,
            decision: 'allow',
            matchedPolicies: matched.map(m => m.id),
            reason: '',
            obligations: {}
        };

        if (matched.length > 0) {
            const primaryPolicy = matched[0]; // Highest precedence
            
            // If primary policy is a 'deny' action, we stop here
            if (primaryPolicy.action === 'deny') {
                decision.allowed = false;
                decision.decision = 'deny';
                decision.reason = primaryPolicy.reason;
            } else {
                decision.decision = primaryPolicy.action; // quarantine, degrade, throttle, etc.
                decision.reason = primaryPolicy.reason;
                decision.obligations = primaryPolicy.config || {};
            }
        }

        // Trace evaluation steps for audit (19.C.7 Improvement)
        decision.evaluationTrace = matched.map(m => ({
            policy_id: m.id,
            type: m.policy_type,
            scope: `${m.scope_type}:${m.scope_id}`,
            action: m.action,
            priority: precedenceMap[m.policy_type] || 99,
            version: m.updated_at
        }));

        // 4. Log Enforcement Evidence (19.C.3) - Async/Background
        this.logEnforcement(context, decision).catch(err => console.error('[ENFORCEMENT-AUDIT] Failed to log:', err));

        return decision;
    }

    /**
     * Get active policies with caching
     */
    static async getActivePolicies() {
        const now = Date.now();
        if (now - policyCache.lastFetch < policyCache.ttl) {
            return policyCache.policies;
        }

        try {
            const sql = `SELECT * FROM governance_policies WHERE status = 'active'`;
            const { rows } = await db.query(sql);
            policyCache.policies = rows;
            policyCache.lastFetch = now;
            return rows;
        } catch (err) {
            console.error('[POLICY-CACHE] Failed to refresh from DB:', err.message);
            // FAIL CLOSED for critical lookups if DB is totally gone
            return policyCache.policies; // Return last known state
        }
    }

    /**
     * Invalidate cache (to be called on policy updates)
     */
    static invalidateCache() {
        policyCache.lastFetch = 0;
        // Broadcast to all nodes
        redis.publish('ppos:governance:policy_updated', 'invalidate').catch(err => {
            console.error('[POLICY-ENFORCER] Failed to publish invalidation:', err);
        });
    }

    /**
     * Log enforcement decision to audit trail
     */
    static async logEnforcement(context, decision) {
        const actionType = `POLICY_ENFORCEMENT_${decision.decision.toUpperCase()}`;
        const sql = `
            INSERT INTO governance_audit (
                operator_id, operator_role, action_type, target_type, target_id, reason, payload
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const payload = {
            ...context,
            decision: decision.decision,
            matched_policies: decision.matchedPolicies,
            evaluation_trace: decision.evaluationTrace, // Added for Phase 19 Hardening
            runtime_enforcement: true
        };

        await db.query(sql, [
            'system-enforcer',
            'system',
            actionType,
            context.tenantId ? 'tenant' : (context.queueName ? 'queue' : 'global'),
            context.tenantId || context.queueName || 'global',
            decision.reason || 'Governance runtime enforcement',
            JSON.stringify(payload)
        ]);
    }
}

module.exports = PolicyEnforcementService;
