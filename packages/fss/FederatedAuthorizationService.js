const PolicyAuthorityClass = require('../federation/PolicyAuthorityResolver');

/**
 * FederatedAuthorizationService (Phase 6)
 * Validates if a region is authorized to emit specific event types.
 */
class FederatedAuthorizationService {
    constructor() {
        this.authorityResolver = new PolicyAuthorityClass();
    }
    /**
     * Checks if a region is authorized to publish a specific event.
     * 
     * @param {string} regionId - The ID of the origin region.
     * @param {string} eventName - The name of the event.
     * @returns {boolean}
     */
    isAuthorized(regionId, eventName) {
        // 1. Events requiring GLOBAL AUTHORITY
        const authorityRequired = [
            'PolicyPublished',
            'PrinterNodeRegistered',
            'TenantQuarantined',
            'TenantPardoned'
        ];

        if (authorityRequired.includes(eventName)) {
            const authoritativeRegionId = this.authorityResolver.getAuthoritativeRegionId();
            if (regionId !== authoritativeRegionId) {
                console.warn(`[FEDERATED-AUTH] Region ${regionId} is NOT authorized for ${eventName}. Required: ${authoritativeRegionId}`);
                return false;
            }
        }

        // 2. Events allowed from ANY valid registered region
        const whiteList = [
            'RegionHealthSummaryPublished',
            'FederatedMatchOutcome',
            'RelayHeartbeatEmitted'
        ];

        if (whiteList.includes(eventName)) {
            return true;
        }

        // 3. Fallback for unknown events: require authority for safety (Fail Closed)
        return regionId === this.authorityResolver.getAuthoritativeRegionId();
    }
}

module.exports = new FederatedAuthorizationService();
