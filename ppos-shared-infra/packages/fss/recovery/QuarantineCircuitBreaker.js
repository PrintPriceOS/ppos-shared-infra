/**
 * PrintPrice OS — Quarantine Circuit Breaker
 * 
 * Prevents toxic loops where malformed events or entities cause repeated processing failures.
 */
class QuarantineCircuitBreaker {
    constructor(redisClient, config = {}) {
        this.redis = redisClient;
        this.threshold = config.threshold || 5;
        this.windowSec = config.windowSec || 3600; // 1 hour
        this.prefix = 'ppos:fss:cb:';
    }

    /**
     * Record a failure for an entity.
     */
    async recordFailure(entityId, reason) {
        const key = `${this.prefix}fails:${entityId}`;
        const count = await this.redis.incr(key);
        
        if (count === 1) {
            await this.redis.expire(key, this.windowSec);
        }

        if (count >= this.threshold) {
            await this.blackhole(entityId, reason);
            return true; // Tripped
        }
        return false;
    }

    /**
     * Transition entity to BLACKHOLED state.
     */
    async blackhole(entityId, reason) {
        console.warn(`[CIRCUIT-BREAKER] Tripped for entity ${entityId}. Reason: ${reason}`);
        const stateKey = `${this.prefix}state:${entityId}`;
        await this.redis.set(stateKey, JSON.stringify({
            status: 'BLACKHOLED',
            reason,
            blackholed_at: new Date().toISOString(),
            manual_release_required: true
        }));
    }

    /**
     * Check if an entity is blackholed.
     */
    async isBlackholed(entityId) {
        const stateKey = `${this.prefix}state:${entityId}`;
        const state = await this.redis.get(stateKey);
        return state ? JSON.parse(state) : null;
    }

    /**
     * Reset circuit breaker (Manual release).
     */
    async release(entityId) {
        await this.redis.del(`${this.prefix}fails:${entityId}`);
        await this.redis.del(`${this.prefix}state:${entityId}`);
        console.log(`[CIRCUIT-BREAKER] Entity ${entityId} released manually.`);
    }
}

module.exports = QuarantineCircuitBreaker;
