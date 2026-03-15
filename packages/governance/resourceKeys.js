// ppos-shared-infra/packages/governance/resourceKeys.js

/**
 * Centralizes Redis keyspace for Resource Governance (Phase 20.B)
 */
const Keys = {
    // Concurrency: ppos:tenant:{tenantId}:concurrency:active -> Integer
    concurrency: (tenantId) => `ppos:tenant:${tenantId}:concurrency:active`,
    
    // Throughput: ppos:tenant:{tenantId}:jobs:{window}:{yyyyMMddHHmm} -> Integer
    jobsWindow: (tenantId, window, timestamp) => {
        const date = new Date(timestamp);
        const parts = {
            minute: date.toISOString().slice(0, 16).replace(/[-:T]/g, ''), // yyyyMMddHHmm
            hour: date.toISOString().slice(0, 13).replace(/[-:T]/g, ''),   // yyyyMMddHH
            day: date.toISOString().slice(0, 10).replace(/[-:T]/g, '')     // yyyyMMdd
        };
        return `ppos:tenant:${tenantId}:jobs:${window}:${parts[window]}`;
    },

    // Depth: ppos:tenant:{tenantId}:queue:{queueName}:depth -> Integer
    queueDepth: (tenantId, queueName) => `ppos:tenant:${tenantId}:queue:${queueName}:depth`,

    // AI Budget: ppos:tenant:{tenantId}:ai_{tokens|cost}:{window}:{timestamp_part}
    aiBudget: (tenantId, type, window, timestamp) => {
        const date = new Date(timestamp);
        const parts = {
            minute: date.toISOString().slice(0, 16).replace(/[-:T]/g, ''), // yyyyMMddHHmm
            hour: date.toISOString().slice(0, 13).replace(/[-:T]/g, ''),   // yyyyMMddHH
            day: date.toISOString().slice(0, 10).replace(/[-:T]/g, '')     // yyyyMMdd
        };
        return `ppos:tenant:${tenantId}:ai_${type}:${window}:${parts[window]}`;
    },

    // AI Concurrency: ppos:tenant:{tenantId}:ai_concurrency:active -> Integer
    aiConcurrency: (tenantId) => `ppos:tenant:${tenantId}:ai_concurrency:active`,

    // AI Lease: ppos:job:{jobId}:ai_lease -> Hash { tenantId, reservedTokens, reservedCost }
    aiLease: (jobId) => `ppos:job:${jobId}:ai_lease`,

    // Lease: ppos:job:{jobId}:capacity_lease -> Hash { tenantId, queueName, reservedAt, ttl }
    jobLease: (jobId) => `ppos:job:${jobId}:capacity_lease`,

    // Burst: ppos:tenant:{tenantId}:burst:{serviceName} -> Hash
    burstBucket: (tenantId, serviceName) => `ppos:tenant:${tenantId}:burst:${serviceName}`
};

module.exports = Keys;
