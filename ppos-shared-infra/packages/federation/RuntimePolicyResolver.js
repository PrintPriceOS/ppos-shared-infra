/**
 * @ppos/shared-infra - RuntimePolicyResolver
 * 
 * Canonical evaluator for runtime governance decisions in multi-region deployments.
 * Combines authority, staleness, and emergency restrictions.
 */
const regionContext = require('../region/RegionContext');
const policyCacheManager = require('./PolicyCacheManager');
const PolicyAuthorityResolver = require('./PolicyAuthorityResolver');
const RegionStalenessEvaluator = require('./RegionStalenessEvaluator');
const emergencyRestrictionManager = require('./EmergencyRestrictionManager');
const metricsService = require('../ops/MetricsService');

class RuntimePolicyResolver {
    constructor() {
        this.authorityResolver = new PolicyAuthorityResolver();
        this.stalenessEvaluator = new RegionStalenessEvaluator();
        
        // Track last heartbeat for staleness (in real app, this comes from a sync service or DB)
        this.lastHeartbeatAt = new Date().toISOString(); 
    }

    /**
     * The master method to check if an action is allowed at runtime.
     * 
     * @param {string} actionName - Name of the action (e.g., 'policy_publish')
     * @param {Object} context - Optional additional context
     * @returns {Object} { allowed: boolean, mode: string, reason: string, ... }
     */
    isActionAllowed(actionName, context = {}) {
        const mode = this.getExecutionMode();
        const info = regionContext.get();
        const isAuthority = this.isAuthorityRegion();

        // 1. EMERGENCY LOCKDOWN (Highest priority)
        if (emergencyRestrictionManager.isRestricted(actionName) || emergencyRestrictionManager.isRestricted('*')) {
            const result = {
                allowed: false,
                mode: 'EMERGENCY_RESTRICTIVE',
                reason: 'emergency_local_restriction',
                region_id: info.region_id,
                restriction_source: 'EmergencyRestrictionManager'
            };
            metricsService.recordRuntimeDecision(actionName, false, result.mode, info.region_id);
            return result;
        }

        // 2. ACTION-SPECIFIC LOGIC
        
        // Actions that MUST happen in authority region
        const authorityRequiredActions = [
            'policy_publish',
            'printer_onboarding',
            'global_mutation',
            'trust_score_mutation'
        ];

        if (authorityRequiredActions.includes(actionName)) {
            if (!isAuthority) {
                const result = {
                    allowed: false,
                    mode: mode,
                    reason: 'non_authoritative_region',
                    region_id: info.region_id,
                    restriction_source: 'PolicyAuthorityResolver'
                };
                metricsService.recordRuntimeDecision(actionName, false, mode, info.region_id);
                return result;
            }

            if (['DEGRADED', 'STALE', 'ISOLATED'].includes(mode)) {
                 const result = {
                    allowed: false,
                    mode: mode,
                    reason: 'authority_region_degraded',
                    region_id: info.region_id,
                    restriction_source: 'RegionStalenessEvaluator'
                };
                metricsService.recordRuntimeDecision(actionName, false, mode, info.region_id);
                return result;
            }
        }

        // Actions that require fresh cache
        const freshCacheRequiredActions = [
            'risky_job_execution',
            'cross_region_publish',
            'printer_identity_mutation'
        ];

        if (freshCacheRequiredActions.includes(actionName)) {
            if (!this.isPolicyCacheFresh()) {
                const result = {
                    allowed: false,
                    mode: mode,
                    reason: 'policy_cache_stale',
                    region_id: info.region_id,
                    restriction_source: 'PolicyCacheManager'
                };
                metricsService.recordRuntimeDecision(actionName, false, mode, info.region_id);
                return result;
            }
        }

        // 3. DEGRADED MODE RESTRICTIONS
        if (mode === 'ISOLATED' || mode === 'REVOKED') {
            // Only allow critical local safety actions
            const safeActions = ['health_status_pub', 'local_analyze', 'local_autofix', 'quarantine_decision', 'metrics_emit'];
            if (!safeActions.includes(actionName)) {
                const result = {
                    allowed: false,
                    mode: mode,
                    reason: 'region_isolated',
                    region_id: info.region_id,
                    restriction_source: 'RegionStalenessEvaluator'
                };
                metricsService.recordRuntimeDecision(actionName, false, mode, info.region_id);
                return result;
            }
        }

        // Default allow
        metricsService.recordRuntimeDecision(actionName, true, mode, info.region_id);
        return {
            allowed: true,
            mode: mode,
            reason: 'normal_operation',
            region_id: info.region_id,
            authority_status: isAuthority ? 'authoritative' : 'non_authoritative'
        };
    }

    /**
     * Determines the current operational mode.
     */
    getExecutionMode() {
        const staleness = this.stalenessEvaluator.evaluate(this.lastHeartbeatAt);
        
        switch (staleness) {
            case 'HEALTHY': return 'NORMAL';
            case 'WARNING': return 'DEGRADED';
            case 'STALE':   return 'STALE';
            case 'ISOLATED': return 'ISOLATED';
            default: return 'UNKNOWN';
        }
    }

    /**
     * Checks if this region is the authority for the given namespace.
     */
    isAuthorityRegion(namespace = '*') {
        const { region_id } = regionContext.get();
        return this.authorityResolver.isAuthorized(region_id, namespace);
    }

    /**
     * Checks if the policy cache is fresh enough for execution.
     */
    isPolicyCacheFresh(policyId = 'global-governance') {
        const policy = policyCacheManager.getPolicy(policyId);
        if (!policy) return false;
        return policy.status === 'FRESH';
    }

    /**
     * Helper to determine if region is in a degraded state.
     */
    isRegionDegraded() {
        const mode = this.getExecutionMode();
        return ['DEGRADED', 'STALE', 'ISOLATED'].includes(mode);
    }

    /**
     * Returns the active restriction overlay.
     */
    getRestrictionOverlay() {
        return {
            restrictions: Array.from(emergencyRestrictionManager.activeRestrictions),
            mode: this.getExecutionMode(),
            timestamp: new Date().toISOString()
        };
    }

    // INTERNAL: In a real system, sync service calls this
    updateHeartbeat() {
        this.lastHeartbeatAt = new Date().toISOString();
    }
}

module.exports = new RuntimePolicyResolver();
