/**
 * PrintPrice OS — Replay Checkpoint Store
 * 
 * Manages the high-water mark for event replay to enable incremental recovery.
 * Uses Redis for shared regional persistence.
 */
class ReplayCheckpointStore {
    constructor(redisClient) {
        this.redis = redisClient;
        this.prefix = 'ppos:fss:checkpoint:';
    }

    /**
     * Set a checkpoint for a specific region and domain.
     */
    async setCheckpoint(regionId, domain, metadata) {
        const key = `${this.prefix}${regionId}:${domain}`;
        const payload = {
            ...metadata,
            checkpoint_at: new Date().toISOString()
        };
        await this.redis.set(key, JSON.stringify(payload));
        return payload;
    }

    /**
     * Get the last checkpoint for a specific region and domain.
     */
    async getCheckpoint(regionId, domain) {
        const key = `${this.prefix}${regionId}:${domain}`;
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Clear checkpoints for a region (e.g., for full rebuild).
     */
    async clearCheckpoints(regionId) {
        const pattern = `${this.prefix}${regionId}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
    }
}

module.exports = ReplayCheckpointStore;
