const db = require('../data/db');
const redis = require('../data/redis');
const Keys = require('./resourceKeys');
const Scripts = require('./governanceScripts');

/**
 * ResourceGovernanceService (Phase 20.A)
 * Handles multi-tenant capacity allocation, quotas, and fair scheduling.
 */
class ResourceGovernanceService {
    /**
     * Evaluate if a request meets resource quotas and capacity limits
     * @param {Object} context { tenantId, queueName, serviceName, jobType, operation }
     */
    static async evaluateRequest(context) {
        const { tenantId } = context;
        
        // 1. Resolve Effective Limits (Hierarchy: Override -> Tenant -> Plan Default)
        const limits = await this.getEffectiveLimits(tenantId);
        
        // 2. Fetch Current Usage from Redis (Hot State)
        const usage = await this.getCurrentUsage(tenantId);

        // 3. Evaluate Constraints
        let decision = {
            allowed: true,
            decision: 'allow',
            reason: '',
            effectiveLimits: limits,
            currentUsage: usage,
            obligations: {}
        };

        // A. Concurrency Check
        if (usage.activeConcurrency >= limits.max_concurrent_jobs) {
            decision.allowed = false;
            decision.decision = 'throttle';
            decision.reason = `Max concurrency reached (${limits.max_concurrent_jobs})`;
            return decision;
        }

        // B. Throughput Check (Jobs per Minute)
        if (usage.jobsThisMinute >= limits.max_jobs_per_minute) {
            decision.allowed = false;
            decision.decision = 'delay';
            decision.reason = `Rate limit exceeded (${limits.max_jobs_per_minute} jpm)`;
            return decision;
        }

        // C. Queue Depth Check
        if (usage.queueDepth >= limits.max_queue_depth) {
            decision.allowed = false;
            decision.decision = 'deny';
            decision.reason = `Tenant queue saturated (${limits.max_queue_depth} depth)`;
        }

        // Log decision for audit (Phase 20.F)
        if (decision.decision !== 'allow') {
            this.logGovernanceDecision(context, decision).catch(err => {
                console.error('[RESOURCE-GOVERNANCE-AUDIT] Failed to log:', err.message);
            });
        }

        return decision;
    }

    /**
     * Log governance decision to audit trail
     */
    static async logGovernanceDecision(context, decision) {
        const actionType = `RESOURCE_GOVERNANCE_${decision.decision.toUpperCase()}`;
        const sql = `
            INSERT INTO governance_audit (
                operator_id, operator_role, action_type, target_type, target_id, reason, payload
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(sql, [
            'resource-enforcer',
            'system',
            actionType,
            'tenant',
            context.tenantId,
            decision.reason,
            JSON.stringify({
                ...context,
                usage: decision.currentUsage,
                limits: decision.effectiveLimits
            })
        ]);
    }

    /**
     * Resolve effective limits for a tenant
     */
    static async getEffectiveLimits(tenantId) {
        // Cache this in Redis for 1 min to avoid SQL spam
        const cacheKey = `ppos:governance:limits:${tenantId}`;
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);

        // Default Limits (Fallback)
        let resolved = {
            max_concurrent_jobs: 2,
            max_jobs_per_minute: 30,
            max_jobs_per_hour: 500,
            max_queue_depth: 100,
            priority_class: 'normal',
            plan_tier: 'standard'
        };

        try {
            // Query DB for Tenant Specific Limits
            const sql = `SELECT * FROM tenant_resource_limits WHERE tenant_id = ? AND is_enabled = 1`;
            const { rows } = await db.query(sql, [tenantId]);
            
            if (rows.length > 0) {
                resolved = { ...resolved, ...rows[0] };
            }

            // Check for temporary overrides
            const overrideSql = `SELECT config FROM tenant_resource_overrides WHERE tenant_id = ? AND expires_at > NOW()`;
            const { rows: overrides } = await db.query(overrideSql, [tenantId]);
            
            if (overrides.length > 0) {
                // Merge overrides from JSON config
                const config = typeof overrides[0].config === 'string' ? JSON.parse(overrides[0].config) : overrides[0].config;
                resolved = { ...resolved, ...config };
            }

            await redis.setex(cacheKey, 60, JSON.stringify(resolved));
            return resolved;
        } catch (err) {
            console.error('[RESOURCE-GOVERNANCE] Failed to resolve limits:', err.message);
            return resolved; // Return defaults on failure
        }
    }

    /**
     * Get real-time usage snapshot from Redis
     */
    static async getCurrentUsage(tenantId, queueName = 'default') {
        const now = Date.now();
        const minuteKey = Keys.jobsWindow(tenantId, 'minute', now);
        const hourKey = Keys.jobsWindow(tenantId, 'hour', now);
        const concurrencyKey = Keys.concurrency(tenantId);
        const depthKey = Keys.queueDepth(tenantId, queueName);

        const [jpm, jph, concurrency, depth] = await Promise.all([
            redis.get(minuteKey),
            redis.get(hourKey),
            redis.get(concurrencyKey),
            redis.get(depthKey)
        ]);

        return {
            jobsThisMinute: parseInt(jpm) || 0,
            jobsThisHour: parseInt(jph) || 0,
            activeConcurrency: parseInt(concurrency) || 0,
            queueDepth: parseInt(depth) || 0
        };
    }

    /**
     * ATOMIC: Reserve capacity for enqueue (Phase 20.B.2)
     */
    static async reserveEnqueue(tenantId, queueName) {
        const now = Date.now();
        const minuteKey = Keys.jobsWindow(tenantId, 'minute', now);
        const hourKey = Keys.jobsWindow(tenantId, 'hour', now);
        const depthKey = Keys.queueDepth(tenantId, queueName);
        
        const limits = await this.getEffectiveLimits(tenantId);
        
        // Load script into Redis if not cached
        if (!this._reserveEnqueueSha) {
            this._reserveEnqueueSha = await redis.script('LOAD', Scripts.reserveEnqueue);
        }

        const result = await redis.evalsha(this._reserveEnqueueSha, 3, 
            minuteKey, hourKey, depthKey,
            limits.max_jobs_per_minute, limits.max_jobs_per_hour, limits.max_queue_depth
        );

        if (result.err) throw new Error(result.err);
        return { ok: true };
    }

    /**
     * ATOMIC: Rollback enqueue capacity (Phase 20.C.1)
     */
    static async rollbackEnqueue(tenantId, queueName) {
        const depthKey = Keys.queueDepth(tenantId, queueName);
        const current = await redis.get(depthKey);
        if (current && parseInt(current) > 0) {
            await redis.decr(depthKey);
        }
    }

    /**
     * ATOMIC: Reserve capacity for worker start (Phase 20.B.2)
     */
    static async reserveStart(jobId, tenantId, leaseTtlSec = 900) {
        const concurrencyKey = Keys.concurrency(tenantId);
        const leaseKey = Keys.jobLease(jobId);
        const limits = await this.getEffectiveLimits(tenantId);
        
        if (!this._reserveStartSha) {
            this._reserveStartSha = await redis.script('LOAD', Scripts.reserveStart);
        }

        const result = await redis.evalsha(this._reserveStartSha, 2,
            concurrencyKey, leaseKey,
            limits.max_concurrent_jobs, jobId, tenantId, Date.now(), leaseTtlSec
        );

        if (result.err) throw new Error(result.err);
        
        // Phase 22.E.1: Maintain Active Tenants Index for optimized scanning
        await redis.sadd('ppos:active_tenants', tenantId);

        return { ok: true };
    }

    /**
     * ATOMIC: Release capacity on finish (Phase 20.B.2)
     */
    static async releaseFinish(jobId, tenantId, queueName) {
        const concurrencyKey = Keys.concurrency(tenantId);
        const leaseKey = Keys.jobLease(jobId);
        const depthKey = Keys.queueDepth(tenantId, queueName);

        if (!this._releaseFinishSha) {
            this._releaseFinishSha = await redis.script('LOAD', Scripts.releaseFinish);
        }

        await redis.evalsha(this._releaseFinishSha, 3, concurrencyKey, leaseKey, depthKey, jobId);
        return { ok: true };
    }
    /**
     * Heartbeat to renew capacity lease (Phase 20.B.3)
     */
    static async heartbeatLease(jobId, leaseTtlSec = 900) {
        const leaseKey = Keys.jobLease(jobId);
        const exists = await redis.expire(leaseKey, leaseTtlSec);
        if (!exists) {
            console.warn(`[GOVERNANCE-HEARTBEAT] Lease for ${jobId} not found during renewal!`);
            return false;
        }
        return true;
    }

    /**
     * ATOMIC: Check burst capacity via Token Bucket (Phase 20.B.4)
     */
    static async checkBurst(tenantId, serviceName, cost = 1) {
        const bucketKey = Keys.burstBucket(tenantId, serviceName);
        const limits = await this.getEffectiveLimits(tenantId);
        
        // Burst capacity: max_jobs_per_minute * burst_multiplier
        const capacity = Math.ceil(limits.max_jobs_per_minute * (limits.burst_multiplier || 1.5));
        const refillRate = limits.max_jobs_per_minute / 60; // tokens per second

        if (!this._tokenBucketSha) {
            this._tokenBucketSha = await redis.script('LOAD', Scripts.tokenBucket);
        }

        const result = await redis.evalsha(this._tokenBucketSha, 1,
            bucketKey, Date.now(), cost, capacity, refillRate
        );

        if (result.err) return { allowed: false, remaining: result.remaining };
        return { allowed: true, remaining: result.remaining };
    }
}

module.exports = ResourceGovernanceService;
