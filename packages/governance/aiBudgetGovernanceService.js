// ppos-shared-infra/packages/governance/aiBudgetGovernanceService.js
const db = require('../data/db');
const redis = require('../data/redis');
const Keys = require('./resourceKeys');
const ResourceGovernanceService = require('./resourceGovernanceService');

/**
 * AIBudgetGovernanceService (Phase 20.E)
 * Handles AI token budgets, spend control, model tiers, and AI concurrency.
 */
class AIBudgetGovernanceService {
    /**
     * Evaluate if a tenant has enough AI budget for a request
     * @param {Object} context { tenantId, jobId, jobType, modelTier, estimatedTokens, estimatedCost }
     */
    static async evaluateBudget(context) {
        const { tenantId, modelTier = 'standard' } = context;
        const limits = await ResourceGovernanceService.getEffectiveLimits(tenantId);
        const usage = await this.getCurrentAIUsage(tenantId);

        let decision = {
            allowed: true,
            decision: 'allow',
            recommendedModelTier: limits.ai_model_tier || 'standard',
            reason: '',
            usage,
            limits
        };

        // 1. Model Tier Fallback Check
        if (this.getModelWeight(modelTier) > this.getModelWeight(limits.ai_model_tier)) {
            decision.decision = 'degrade';
            decision.recommendedModelTier = limits.ai_model_tier;
            decision.reason = `Model tier ${modelTier} exceeds tenant limit (${limits.ai_model_tier})`;
            // Note: In 'degrade' mode, we might still allow the job but require using a cheaper model.
        }

        // 2. AI Concurrency Check
        if (usage.activeAIConcurrency >= limits.max_ai_concurrent_jobs && limits.max_ai_concurrent_jobs > 0) {
            decision.allowed = false;
            decision.decision = 'deny';
            decision.reason = `Max AI concurrency reached (${limits.max_ai_concurrent_jobs})`;
            return decision;
        }

        // 3. Token Budget Checks (Minute, Hour, Day)
        if (limits.max_ai_tokens_per_minute > 0 && usage.tokensMinute >= limits.max_ai_tokens_per_minute) {
            decision.allowed = false;
            decision.decision = 'delay';
            decision.reason = 'AI Token limit (minute) reached';
            return decision;
        }

        if (limits.max_ai_tokens_per_hour > 0 && usage.tokensHour >= limits.max_ai_tokens_per_hour) {
            decision.allowed = false;
            decision.decision = 'delay';
            decision.reason = 'AI Token limit (hour) reached';
            return decision;
        }

        // 4. Cost Budget Checks (Hour, Day)
        if (limits.max_ai_cost_per_day > 0 && usage.costDay >= limits.max_ai_cost_per_day) {
            decision.allowed = false;
            decision.decision = 'deny';
            decision.reason = 'Daily AI cost budget exhausted';
            return decision;
        }

        return decision;
    }

    /**
     * Reserve estimated budget before job execution
     */
    static async reserveBudget(jobId, tenantId, estimatedTokens = 0, estimatedCost = 0) {
        const now = Date.now();
        const minuteKey = Keys.aiBudget(tenantId, 'tokens', 'minute', now);
        const hourKey = Keys.aiBudget(tenantId, 'tokens', 'hour', now);
        const dayKey = Keys.aiBudget(tenantId, 'tokens', 'day', now);
        const costHourKey = Keys.aiBudget(tenantId, 'cost', 'hour', now);
        const costDayKey = Keys.aiBudget(tenantId, 'cost', 'day', now);
        const aiConcurrencyKey = Keys.aiConcurrency(tenantId);
        const aiLeaseKey = Keys.aiLease(jobId);

        const multi = redis.multi();

        // Increment usage counters with estimate
        if (estimatedTokens > 0) {
            multi.incrby(minuteKey, estimatedTokens);
            multi.incrby(hourKey, estimatedTokens);
            multi.incrby(dayKey, estimatedTokens);
            multi.expire(minuteKey, 120);
            multi.expire(hourKey, 7200);
            multi.expire(dayKey, 100000);
        }

        if (estimatedCost > 0) {
            // Redis INCRBYFLOAT for cost
            multi.incrbyfloat(costHourKey, estimatedCost);
            multi.incrbyfloat(costDayKey, estimatedCost);
            multi.expire(costHourKey, 7200);
            multi.expire(costDayKey, 100000);
        }

        multi.incr(aiConcurrencyKey);

        // Store lease details for reconciliation
        multi.hmset(aiLeaseKey, {
            tenantId,
            reservedTokens: estimatedTokens,
            reservedCost: estimatedCost,
            reservedAt: now
        });
        multi.expire(aiLeaseKey, 3600); // 1 hour safety TTL

        await multi.exec();

        await this.logAIEvent(tenantId, jobId, 'AI_BUDGET_RESERVE', { estimatedTokens, estimatedCost });
        return { ok: true };
    }

    /**
     * Reconcile estimated budget with actual consumption
     */
    static async reconcileBudget(jobId, actualTokens, actualCost) {
        const aiLeaseKey = Keys.aiLease(jobId);
        const lease = await redis.hgetall(aiLeaseKey);
        
        if (!lease || !lease.tenantId) return;

        const { tenantId, reservedTokens, reservedCost } = lease;
        const now = Date.now();

        // Calculate delta (positive if we spent more than estimated, negative if less)
        const tokenDelta = actualTokens - (parseInt(reservedTokens) || 0);
        const costDelta = actualCost - (parseFloat(reservedCost) || 0);

        const minuteKey = Keys.aiBudget(tenantId, 'tokens', 'minute', now);
        const hourKey = Keys.aiBudget(tenantId, 'tokens', 'hour', now);
        const dayKey = Keys.aiBudget(tenantId, 'tokens', 'day', now);
        const costHourKey = Keys.aiBudget(tenantId, 'cost', 'hour', now);
        const costDayKey = Keys.aiBudget(tenantId, 'cost', 'day', now);
        const aiConcurrencyKey = Keys.aiConcurrency(tenantId);

        const multi = redis.multi();

        if (tokenDelta !== 0) {
            multi.incrby(minuteKey, tokenDelta);
            multi.incrby(hourKey, tokenDelta);
            multi.incrby(dayKey, tokenDelta);
        }

        if (costDelta !== 0) {
            multi.incrbyfloat(costHourKey, costDelta);
            multi.incrbyfloat(costDayKey, costDelta);
        }

        multi.decr(aiConcurrencyKey);
        multi.del(aiLeaseKey);

        await multi.exec();

        await this.logAIEvent(tenantId, jobId, 'AI_BUDGET_RECONCILE', { 
            actualTokens, actualCost, tokenDelta, costDelta 
        });

        if (tokenDelta > 10000 || costDelta > 1.0) {
            await this.logAIEvent(tenantId, jobId, 'AI_BUDGET_OVERAGE_WARNING', { tokenDelta, costDelta });
        }
    }

    /**
     * Get current AI usage snapshot
     */
    static async getCurrentAIUsage(tenantId) {
        const now = Date.now();
        const tokensMinute = await redis.get(Keys.aiBudget(tenantId, 'tokens', 'minute', now));
        const tokensHour = await redis.get(Keys.aiBudget(tenantId, 'tokens', 'hour', now));
        const tokensDay = await redis.get(Keys.aiBudget(tenantId, 'tokens', 'day', now));
        const costHour = await redis.get(Keys.aiBudget(tenantId, 'cost', 'hour', now));
        const costDay = await redis.get(Keys.aiBudget(tenantId, 'cost', 'day', now));
        const activeAIConcurrency = await redis.get(Keys.aiConcurrency(tenantId));

        return {
            tokensMinute: parseInt(tokensMinute) || 0,
            tokensHour: parseInt(tokensHour) || 0,
            tokensDay: parseInt(tokensDay) || 0,
            costHour: parseFloat(costHour) || 0,
            costDay: parseFloat(costDay) || 0,
            activeAIConcurrency: parseInt(activeAIConcurrency) || 0
        };
    }

    static getModelWeight(tier) {
        const weights = { 'economy': 1, 'standard': 2, 'premium': 3 };
        return weights[tier] || 0;
    }

    static async logAIEvent(tenantId, jobId, actionType, payload) {
        try {
            const sql = `
                INSERT INTO governance_audit (
                    tenant_id, operator_id, operator_role, action_type, target_type, target_id, payload
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            await db.query(sql, [
                tenantId,
                'ai-governor',
                'system',
                actionType,
                'job',
                jobId,
                JSON.stringify(payload)
            ]);
        } catch (e) {
            console.error('[AI-GOVERNANCE-AUDIT] Failed:', e.message);
        }
    }
}

module.exports = AIBudgetGovernanceService;
