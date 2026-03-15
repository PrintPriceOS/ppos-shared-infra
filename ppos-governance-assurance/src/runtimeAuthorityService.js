const { runtimePolicyResolver, emergencyRestrictionManager } = require('@ppos/shared-infra');

/**
 * Runtime Authority Service for Governance Assurance.
 * 
 * Provides high-level evaluation of federated authority and regional constraints.
 */
class RuntimeAuthorityService {
    /**
     * Evaluates if a policy-sensitive action is allowed in the current regional context.
     * 
     * @param {string} action - The action name
     * @param {Object} regionContext - Context override (optional)
     */
    evaluatePolicyAction(action, regionContext = {}) {
        const decision = runtimePolicyResolver.isActionAllowed(action, regionContext);
        
        return {
            ...decision,
            timestamp: new Date().toISOString(),
            assurance_vetted: true
        };
    }

    /**
     * Checks if a request violates any active emergency restrictive overlays.
     */
    evaluateEmergencyOverride(request, regionContext = {}) {
        const restrictions = runtimePolicyResolver.getRestrictionOverlay();
        
        const hit = restrictions.restrictions.find(r => 
            r === '*' || 
            (request.capability && r === request.capability) ||
            (request.action && r === request.action)
        );

        return {
            restricted: !!hit,
            reason: hit ? 'EMERGENCY_RESTRICTIVE_MODE' : 'NORMAL',
            restriction: hit || null,
            mode: restrictions.mode
        };
    }

    /**
     * Specific validator for policy mutations.
     * Ensures authority region + fresh cache + no lockdown.
     */
    validateAuthorityForPolicyMutation(request, regionContext = {}) {
        const decision = this.evaluatePolicyAction('policy_publish', regionContext);
        
        if (!decision.allowed) {
            return {
                valid: false,
                code: 'AUTHORITY_DENIED',
                message: `Policy mutation rejected: ${decision.reason}`,
                details: decision
            };
        }

        return {
            valid: true,
            code: 'AUTHORITY_VERIFIED',
            expires_at: new Date(Date.now() + 3600000).toISOString() // Valid for 1 hour
        };
    }

    /**
     * Triggers a local emergency lockdown.
     */
    activateEmergencyLockdown(capability = '*') {
        emergencyRestrictionManager.restrict(capability);
        return {
            status: 'LOCKED',
            capability: capability,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Clears emergency lockdown.
     */
    clearEmergencyLockdown() {
        emergencyRestrictionManager.clear();
        return {
            status: 'CLEARED',
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = new RuntimeAuthorityService();
