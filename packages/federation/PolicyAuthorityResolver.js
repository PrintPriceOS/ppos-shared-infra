/**
 * @ppos/shared-infra - PolicyAuthorityResolver
 * 
 * Determines which region is authorized to publish global policies.
 */
class PolicyAuthorityResolver {
    constructor(config = {}) {
        this.globalHub = config.globalHub || 'EU-PPOS-1';
        this.delegatedAuthorities = config.delegatedAuthorities || {};
    }

    /**
     * Checks if a region is authorized for a specific policy namespace.
     */
    isAuthorized(regionId, namespace = '*') {
        if (regionId === this.globalHub) return true;
        
        if (this.delegatedAuthorities[namespace] === regionId) return true;

        return false;
    }

    /**
     * Returns the authoritative region for a namespace.
     */
    getAuthoritativeRegion(namespace = '*') {
        return this.delegatedAuthorities[namespace] || this.globalHub;
    }

    getAuthoritativeRegionId(namespace = '*') {
        return this.getAuthoritativeRegion(namespace);
    }
}

module.exports = PolicyAuthorityResolver;
