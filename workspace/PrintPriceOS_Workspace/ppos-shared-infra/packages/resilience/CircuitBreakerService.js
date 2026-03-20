// ppos-shared-infra/packages/resilience/CircuitBreakerService.js
const redis = require('../data/redis');
const db = require('../data/db');

/**
 * CircuitBreakerService (Phase 21.C.1)
 * Protects the system from cascading failures by tracking external dependency health in Redis.
 */
class CircuitBreakerService {
    /**
     * Default configurations by dependency type
     */
    static get CONFIGS() {
        return {
            'LLM': { threshold: 5, window: 60, cooldown: 60, probes: 2 },
            'WEBHOOK': { threshold: 10, window: 300, cooldown: 300, probes: 5 },
            'STORAGE': { threshold: 3, window: 60, cooldown: 30, probes: 1 },
            'ENGINE': { threshold: 2, window: 60, cooldown: 15, probes: 1 },
            'DEFAULT': { threshold: 5, window: 60, cooldown: 30, probes: 1 }
        };
    }

    /**
     * Check if a dependency is available
     * @param {string} serviceName Name of the dependency (e.g., 'openai', 'gs-engine')
     * @param {string} type CONFIG key ('LLM', 'STORAGE', etc.)
     */
    static async checkAvailability(serviceName, type = 'DEFAULT') {
        const config = this.CONFIGS[type] || this.CONFIGS.DEFAULT;
        const keyBase = `ppos:breaker:${serviceName}`;
        const stateKey = `${keyBase}:state`;
        const probesKey = `${keyBase}:probes`;

        const state = await redis.get(stateKey) || 'CLOSED';

        if (state === 'OPEN') {
            return { available: false, state: 'OPEN', reason: `Circuit breaker active for ${serviceName}` };
        }

        if (state === 'HALF_OPEN') {
            const currentProbes = await redis.incr(probesKey);
            if (currentProbes > config.probes) {
                return { available: false, state: 'HALF_OPEN_SATURATED', reason: 'Probe limit reached' };
            }
            return { available: true, state: 'HALF_OPEN' };
        }

        return { available: true, state: 'CLOSED' };
    }

    /**
     * Record a failure for a service
     */
    static async recordFailure(serviceName, type = 'DEFAULT') {
        const config = this.CONFIGS[type] || this.CONFIGS.DEFAULT;
        const keyBase = `ppos:breaker:${serviceName}`;
        const countKey = `${keyBase}:fail_count`;
        const stateKey = `${keyBase}:state`;

        // 1. Increment failure counter
        const count = await redis.incr(countKey);
        if (count === 1) await redis.expire(countKey, config.window);

        // 2. Check if threshold reached
        if (count >= config.threshold) {
            const currentState = await redis.get(stateKey);
            if (currentState !== 'OPEN') {
                await this.trip(serviceName, type, `Threshold of ${config.threshold} reached (${count} failures)`);
            }
        }
    }

    /**
     * Record a success for a service
     */
    static async recordSuccess(serviceName) {
        const keyBase = `ppos:breaker:${serviceName}`;
        const stateKey = `${keyBase}:state`;
        const countKey = `${keyBase}:fail_count`;
        const probesKey = `${keyBase}:probes`;

        const state = await redis.get(stateKey);
        if (state === 'HALF_OPEN') {
            // Close the circuit
            await redis.del(stateKey);
            await redis.del(countKey);
            await redis.del(probesKey);
            await this.logStateChange(serviceName, 'CLOSED', 'Success in half-open state');
        } else {
            // Just reset the counter in closed state occasionally
            await redis.del(countKey);
        }
    }

    /**
     * Trip the circuit breaker to OPEN
     */
    static async trip(serviceName, type, reason) {
        const config = this.CONFIGS[type] || this.CONFIGS.DEFAULT;
        const keyBase = `ppos:breaker:${serviceName}`;
        const stateKey = `${keyBase}:state`;
        const probesKey = `${keyBase}:probes`;

        await redis.set(stateKey, 'OPEN', 'EX', config.cooldown);
        await redis.del(probesKey);

        // Schedule HALF_OPEN transition (simulated by expire + "not present" state)
        // In Redis, when 'OPEN' key expires, subsequent checks return null, 
        // but we want a HALF_OPEN phase.
        // We can do this by setting state to HALF_OPEN when OPEN expires.
        // Alternatively, use a timer or a more complex state machine.
        // For simplicity here, we'll use a longer expiry and manually transition 
        // if needed, or rely on the caller logic.
        
        // Better: Set it to OPEN. When it expires, next check sees nothing -> CLOSED.
        // But the user requested HALF_OPEN. 
        // Let's use two keys: `ppos:breaker:service:state` and `ppos:breaker:service:grace_expiry`.
        
        await this.logStateChange(serviceName, 'OPEN', reason);
        
        // Set a timer to transition to HALF_OPEN after cooldown
        setTimeout(async () => {
            const current = await redis.get(stateKey);
            if (current === 'OPEN') {
                await redis.set(stateKey, 'HALF_OPEN', 'EX', config.window * 2);
                await this.logStateChange(serviceName, 'HALF_OPEN', 'Cooldown window passed');
            }
        }, config.cooldown * 1000);
    }

    /**
     * Log state change to audit trail
     */
    static async logStateChange(serviceName, state, reason) {
        try {
            console.log(`[CIRCUIT-BREAKER][${serviceName}] State -> ${state} | Reason: ${reason}`);
            const sql = `
                INSERT INTO governance_audit (
                    operator_id, operator_role, action_type, target_type, target_id, reason, payload
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            await db.query(sql, [
                'circuit-breaker',
                'system',
                'CIRCUIT_BREAKER_TRANSITION',
                'dependency',
                serviceName,
                `State changed to ${state}`,
                JSON.stringify({ state, reason, timestamp: new Date().toISOString() })
            ]);
        } catch (err) {
            console.error('[CIRCUIT-BREAKER-AUDIT] Failed to log:', err.message);
        }
    }
}

module.exports = CircuitBreakerService;
