// ppos-shared-infra/packages/governance/AICacheService.js
const redis = require('../data/redis');
const db = require('../data/db');
const crypto = require('crypto');

/**
 * AICacheService (Phase 22.D)
 * Reduces platform cost and latency by caching reusable AI results.
 */
class AICacheService {
    /**
     * Generate a deterministic key for a specific finding/fix
     */
    static generateKey(fileHash, findingCode, signature) {
        const hash = crypto.createHash('sha256')
            .update(`${fileHash}:${findingCode}:${JSON.stringify(signature)}`)
            .digest('hex');
        return `ppos:aicache:${hash}`;
    }

    /**
     * Retrieve a cached result
     */
    static async get(fileHash, findingCode, signature) {
        const key = this.generateKey(fileHash, findingCode, signature);
        
        // 1. Check Redis (L1)
        const cached = await redis.get(key);
        if (cached) {
            console.log(`[AICache] L1 HIT: ${key}`);
            return JSON.parse(cached);
        }

        // 2. Check DB (L2 - Historical) - Optimization for very long windows
        /* Implementation note: In high-scale, we'd skip DB check for latency,
           but for print jobs, saving $0.30/job is worth a 50ms DB lookup. */
        const sql = `SELECT payload FROM ai_cache WHERE cache_key = ? LIMIT 1`;
        const [row] = await db.query(sql, [key]);
        if (row) {
            console.log(`[AICache] L2 HIT: ${key}`);
            // Backfill L1
            await redis.set(key, JSON.stringify(row.payload), 'EX', 86400 * 7); // 7 days
            return row.payload;
        }

        return null;
    }

    /**
     * Store a result in cache
     */
    static async set(fileHash, findingCode, signature, result, ttlSeconds = 86400 * 7) {
        const key = this.generateKey(fileHash, findingCode, signature);
        
        // 1. Store in Redis
        await redis.set(key, JSON.stringify(result), 'EX', ttlSeconds);

        // 2. Persist to DB for long-term efficiency
        const sql = `
            INSERT INTO ai_cache (cache_key, file_hash, finding_code, payload)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE payload = VALUES(payload)
        `;
        await db.query(sql, [key, fileHash, findingCode, JSON.stringify(result)]);
        
        console.log(`[AICache] STORED: ${key}`);
    }
}

module.exports = AICacheService;
