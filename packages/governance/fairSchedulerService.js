// ppos-shared-infra/packages/governance/fairSchedulerService.js
const ResourceGovernanceService = require('./resourceGovernanceService');
const PolicyEnforcementService = require('./policyEnforcementService');
const AIBudgetGovernanceService = require('./aiBudgetGovernanceService');
const featureFlagService = require('./FeatureFlagService');

/**
 * FairSchedulerService (Phase 20.D)
 * Implements weighted fair scheduling logic based on priority, weight, aging, and saturation.
 */
class FairSchedulerService {
    /**
     * Decision constants for scoring
     */
    /**
     * Decision constants for scoring
     */
    static get PRIORITY_SCORES() {
        return {
            'critical': 1000,
            'high': 700,
            'normal': 400,
            'low': 200,
            'trial': 100
        };
    }

    /**
     * Tunable parameters (Phase 22.B.3)
     */
    static get TUNING_CONFIG() {
        return {
            aging_multiplier: process.env.SCHEDULER_AGING_MULTIPLIER || 2.5, // Increase score per second
            aging_cap: process.env.SCHEDULER_AGING_CAP || 300,
            weight_factor: process.env.SCHEDULER_WEIGHT_FACTOR || 12,
            saturation_penalties: {
                concurrency_high: 60,   // > 80% usage
                concurrency_max: 250,   // >= 100% usage
                throughput_high: 75,    // > 90% usage
                ai_budget_risk: 100     // Near AI budget limit
            }
        };
    }

    /**
     * Compute a dispatch score for a candidate job
     * @param {Object} job { id, data: { tenant_id, governance: { enqueuedAt } } }
     */
    static async computeDispatchScore(job) {
        const { tenant_id, governance } = job.data;
        const limits = await ResourceGovernanceService.getEffectiveLimits(tenant_id);
        const usage = await ResourceGovernanceService.getCurrentUsage(tenant_id);
        const config = this.TUNING_CONFIG;
        
        // 1. Base Priority Score
        const priorityScore = this.PRIORITY_SCORES[limits.priority_class] || 400;

        // 2. Weight Score (Gated by SCHEDULER_V2_ENABLED)
        const isV2 = await featureFlagService.isEnabled('SCHEDULER_V2_ENABLED');
        const weight = limits.weight || 10;
        const weightScore = isV2 ? (weight * config.weight_factor) : 0;

        // 3. Aging Score (Phase 22.B.2: Proportional ramp-up vs Legacy Step-based)
        const enqueuedAt = new Date(governance?.enqueuedAt || Date.now());
        const waitSeconds = (Date.now() - enqueuedAt.getTime()) / 1000;
        
        let agingScore = 0;
        if (isV2) {
            agingScore = Math.min(waitSeconds * config.aging_multiplier, config.aging_cap);
        } else {
            // Legacy: 100 points for every full minute of wait
            agingScore = Math.min(Math.floor(waitSeconds / 60) * 100, 500);
        }

        // 4. Saturation Penalty
        let saturationPenalty = 0;
        
        // Concurrency pressure penalty
        const concurrencyUsageRatio = usage.activeConcurrency / (limits.max_concurrent_jobs || 1);
        if (concurrencyUsageRatio > 0.8) {
            saturationPenalty += config.saturation_penalties.concurrency_high;
        }
        if (concurrencyUsageRatio >= 1.0) {
            saturationPenalty += config.saturation_penalties.concurrency_max;
        }

        // Throughput pressure penalty
        const throughputUsageRatio = usage.jobsThisMinute / (limits.max_jobs_per_minute || 1);
        if (throughputUsageRatio > 0.9) {
            saturationPenalty += config.saturation_penalties.throughput_high;
        }

        const finalScore = priorityScore + weightScore + agingScore - saturationPenalty;

        return {
            jobId: job.id,
            tenantId: tenant_id,
            priorityClass: limits.priority_class,
            priorityScore,
            weight,
            weightScore,
            agingScore,
            saturationPenalty,
            dispatchScore: finalScore,
            eligibility: await this.checkEligibility(job, limits, usage)
        };
    }

    /**
     * Check if a job is even eligible for dispatch right now
     */
    static async checkEligibility(job, limits, usage) {
        const { tenant_id, governance } = job.data;
        
        // 1. Policy Gate (Phase 19)
        const policyDecision = await PolicyEnforcementService.evaluate({
            tenantId: tenant_id,
            queueName: governance?.queueName || 'default',
            serviceName: 'ppos-fair-scheduler',
            jobType: governance?.jobType || 'execute',
            operation: 'execute'
        });

        if (!policyDecision.allowed) return { eligible: false, reason: `Policy: ${policyDecision.reason}` };

        // 2. Resource Gate (Phase 20)
        if (usage.activeConcurrency >= limits.max_concurrent_jobs) {
            return { eligible: false, reason: 'Concurrency limit reached' };
        }

        if (usage.jobsThisMinute >= limits.max_jobs_per_minute) {
            return { eligible: false, reason: 'Throughput limit reached' };
        }

        // 3. AI Budget Gate (Phase 20.E)
        if (job.data.requiresAI || job.data.jobType === 'AUTOFIX') {
            const aiBudgetDecision = await AIBudgetGovernanceService.evaluateBudget({
                tenantId: tenant_id,
                jobId: job.id,
                jobType: job.data.jobType || 'execute',
                modelTier: job.data.modelTier || 'standard'
            });

            if (!aiBudgetDecision.allowed) {
                return { eligible: false, reason: `AI Budget: ${aiBudgetDecision.reason}` };
            }
        }

        return { eligible: true };
    }

    /**
     * Rank a set of candidates and select the best one
     * @param {Array} candidates List of jobs
     */
    static async rankAndSelect(candidates) {
        if (!candidates || candidates.length === 0) return null;

        const scoredCandidates = await Promise.all(
            candidates.map(async job => await this.computeDispatchScore(job))
        );

        // Filter only eligible candidates
        const eligible = scoredCandidates.filter(c => c.eligibility.eligible);
        
        if (eligible.length === 0) {
            return {
                winner: null,
                traces: scoredCandidates
            };
        }

        // Sort by dispatchScore DESC
        eligible.sort((a, b) => b.dispatchScore - a.dispatchScore);

        const winner = eligible[0];
        
        return {
            winner: candidates.find(c => c.id === winner.jobId),
            trace: winner,
            allTraces: scoredCandidates
        };
    }
}

module.exports = FairSchedulerService;
