// ppos-shared-infra/packages/governance/governanceScripts.js

/**
 * Atomic Lua Scripts for Resource Governance (Phase 20.B)
 * Logic resides in Redis to prevent race conditions during quota checks.
 */
const Scripts = {
    /**
     * ATOMIC_RESERVE_ENQUEUE
     * Keys: [minuteKey, hourKey, depthKey]
     * Args: [maxMinute, maxHour, maxDepth]
     */
    reserveEnqueue: `
        local minuteUsage = tonumber(redis.call('GET', KEYS[1]) or '0')
        local hourUsage = tonumber(redis.call('GET', KEYS[2]) or '0')
        local currentDepth = tonumber(redis.call('GET', KEYS[3]) or '0')

        if minuteUsage >= tonumber(ARGV[1]) then return {err = 'THROTTLE_MINUTE'} end
        if hourUsage >= tonumber(ARGV[2]) then return {err = 'THROTTLE_HOUR'} end
        if currentDepth >= tonumber(ARGV[3]) then return {err = 'DENY_DEPTH'} end

        redis.call('INCR', KEYS[1])
        redis.call('INCR', KEYS[2])
        redis.call('INCR', KEYS[3])
        redis.call('EXPIRE', KEYS[1], 120)
        redis.call('EXPIRE', KEYS[2], 7200)

        return {ok = 1}
    `,

    /**
     * ATOMIC_RESERVE_START
     * Keys: [concurrencyKey, leaseKey]
     * Args: [maxConcurrency, jobId, tenantId, leaseTtlSec]
     */
    reserveStart: `
        local active = tonumber(redis.call('GET', KEYS[1]) or '0')
        if active >= tonumber(ARGV[1]) then return {err = 'THROTTLE_CONCURRENCY'} end

        redis.call('INCR', KEYS[1])
        redis.call('HMSET', KEYS[2], 
            'jobId', ARGV[2], 
            'tenantId', ARGV[3], 
            'reservedAt', ARGV[4],
            'ttl', ARGV[5]
        )
        redis.call('EXPIRE', KEYS[2], tonumber(ARGV[5]))

        return {ok = 1}
    `,

    /**
     * ATOMIC_RELEASE_FINISH
     * Keys: [concurrencyKey, leaseKey, depthKey]
     * Args: [jobId]
     */
    releaseFinish: `
        local leaseExists = redis.call('EXISTS', KEYS[2])
        if leaseExists == 1 then
            redis.call('DECR', KEYS[1])
            redis.call('DEL', KEYS[2])
            -- Ensure concurrency doesn't go negative
            local current = tonumber(redis.call('GET', KEYS[1]) or '0')
            if current < 0 then redis.call('SET', KEYS[1], '0') end
        end
        
        -- Always decrement queue depth if it exists
        local depth = tonumber(redis.call('GET', KEYS[3]) or '0')
        if depth > 0 then
            redis.call('DECR', KEYS[3])
        end

        return {ok = 1}
    `,

    /**
     * ATOMIC_TOKEN_BUCKET: Handle bursty requests
     * Keys: [bucketKey]
     * Args: [nowMs, cost, capacity, refillRatePerSec]
     */
    tokenBucket: `
        local bucket = redis.call('HMGET', KEYS[1], 'tokens', 'lastRefill')
        local tokens = tonumber(bucket[1] or ARGV[3])
        local lastRefill = tonumber(bucket[2] or ARGV[1])
        local now = tonumber(ARGV[1])
        local cost = tonumber(ARGV[2])
        local capacity = tonumber(ARGV[3])
        local refillRate = tonumber(ARGV[4])

        -- Refill tokens based on time passed
        local delta = math.max(0, now - lastRefill) / 1000
        tokens = math.min(capacity, tokens + (delta * refillRate))
        
        if tokens >= cost then
            tokens = tokens - cost
            redis.call('HMSET', KEYS[1], 'tokens', tokens, 'lastRefill', now)
            redis.call('EXPIRE', KEYS[1], 3600)
            return {ok = 1, remaining = tokens}
        else
            return {err = 'THROTTLE_BURST', remaining = tokens}
        end
    `
};

module.exports = Scripts;
