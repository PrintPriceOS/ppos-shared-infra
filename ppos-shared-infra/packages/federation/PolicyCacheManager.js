/**
 * @ppos/shared-infra - PolicyCacheManager
 * 
 * Manages regional caching and validation of global governance policies.
 */
const fs = require('fs');
const path = require('path');

class PolicyCacheManager {
    constructor() {
        this.cachePath = path.join(process.cwd(), '.runtime', 'governance', 'policy_cache.json');
        if (!fs.existsSync(path.dirname(this.cachePath))) {
            fs.mkdirSync(path.dirname(this.cachePath), { recursive: true });
        }
    }

    /**
     * Updates the local cache with a verified policy event.
     */
    update(event) {
        const cache = this.loadCache();
        const entry = {
            policy_id: event.entity_id,
            payload: event.payload,
            authority: event.origin_region,
            version: event.payload.version || 1,
            fetched_at: new Date().toISOString(),
            status: 'FRESH'
        };

        cache[event.entity_id] = entry;
        this.saveCache(cache);
        return true;
    }

    /**
     * Retrieves a policy from the cache.
     */
    getPolicy(policyId) {
        const cache = this.loadCache();
        const entry = cache[policyId];
        
        if (!entry) return null;

        // Check for staleness (e.g., 24h)
        const age = (new Date() - new Date(entry.fetched_at)) / 1000;
        if (age > 86400) {
            entry.status = 'STALE';
        }

        return entry;
    }

    loadCache() {
        if (fs.existsSync(this.cachePath)) {
            try {
                return JSON.parse(fs.readFileSync(this.cachePath, 'utf8'));
            } catch (e) {
                return {};
            }
        }
        return {};
    }

    saveCache(cache) {
        fs.writeFileSync(this.cachePath, JSON.stringify(cache, null, 2));
    }
}

module.exports = new PolicyCacheManager();
