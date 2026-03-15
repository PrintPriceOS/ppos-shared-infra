// ppos-shared-infra/packages/governance/FeatureFlagService.js
const redis = require('../data/redis');

/**
 * FeatureFlagService (Phase 22.G)
 * Manages runtime toggles for platform optimizations.
 * Prevents regressions during rollout.
 */
class FeatureFlagService {
    /**
     * Check if a specific optimization feature is enabled
     * @param {string} flagName 
     */
    static async isEnabled(flagName) {
        // 1. Check Environment Variable (Override)
        const envVar = `FLAG_${flagName}`;
        if (process.env[envVar] === 'true') return true;
        if (process.env[envVar] === 'false') return false;

        // 2. Check Redis (Runtime Control)
        const redisKey = `ppos:config:features:${flagName}`;
        const val = await redis.get(redisKey);
        
        if (val === 'true') return true;
        if (val === 'false') return false;

        // 3. Default Values (Safety First)
        const defaults = {
            AI_CACHE_ENABLED: false,
            WARM_POOL_ENABLED: false,
            SCHEDULER_V2_ENABLED: false,
            MATERIALIZATION_ENABLED: false,
            EFFICIENCY_DASHBOARD_ENABLED: true
        };

        return defaults[flagName] || false;
    }

    /**
     * Global Kill Switch (Emergency)
     */
    static async isEmergencyStopActive() {
        const val = await redis.get('ppos:config:emergency_stop');
        return val === 'true';
    }

    /**
     * Update a flag state (Authorized only)
     */
    static async setFlag(flagName, value) {
        const redisKey = `ppos:config:features:${flagName}`;
        await redis.set(redisKey, value.toString());
        console.log(`[FEATURE-FLAG] ${flagName} set to ${value}`);
    }
}

module.exports = FeatureFlagService;
