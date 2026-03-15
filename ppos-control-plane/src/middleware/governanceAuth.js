const { runtimePolicyResolver } = require('@ppos/shared-infra');

/**
 * Middleware to enforce multi-region runtime governance in the control plane.
 * 
 * @param {string} actionKey - The action to validate (e.g., 'policy_publish')
 */
function requireGovernanceAction(actionKey) {
    return (req, res, next) => {
        const decision = runtimePolicyResolver.isActionAllowed(actionKey);

        if (!decision.allowed) {
            console.warn(`[CONTROL-PLANE-BLOCK] Action '${actionKey}' denied: ${decision.reason} (Mode: ${decision.mode})`);
            
            const statusCode = decision.mode === 'EMERGENCY_RESTRICTIVE' ? 403 : 503;
            
            return res.status(statusCode).json({
                error: 'GOVERNANCE_RUNTIME_BLOCK',
                message: `This region is currently not allowed to perform this action: ${decision.reason}`,
                mode: decision.mode,
                region_id: decision.region_id,
                decision: decision
            });
        }

        next();
    };
}

module.exports = { requireGovernanceAction };
