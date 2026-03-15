const policyEnforcementService = require('../../governance/policyEnforcementService');

/**
 * PolicyPublished Reducer (Phase v1.7.0)
 * Handles global policy updates with idempotency.
 */
module.exports = {
    async apply(envelope) {
        const { payload } = envelope;
        console.log(`[REDUCER:PolicyPublished] Syncing policy ${payload.policy_id}`);
        
        // Materialize side-effect
        await policyEnforcementService.invalidateCache();
        
        return { ok: true, materialized: 'POLICY_CACHE_INVALIDATED' };
    }
};
