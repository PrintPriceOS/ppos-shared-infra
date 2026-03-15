const redis = require('../data/redis');

/**
 * RedisVersionStore (Phase v1.8.0)
 * 
 * Durable, shared storage for entity versions and authority epochs.
 * Supports multi-instance consistency within a region.
 */
class RedisVersionStore {
    constructor() {
        this.keyPrefix = `ppos:fss:versions:${process.env.PPOS_REGION_ID || 'local'}`;
    }

    /**
     * Loads all versions (Backwards compatibility or bulk operations)
     */
    async load() {
        const data = await redis.hgetall(this.keyPrefix);
        const versions = {};
        for (const [key, value] of Object.entries(data)) {
            versions[key] = JSON.parse(value);
        }
        return versions;
    }

    /**
     * Fetches a specific entity version record.
     */
    async get(entityType, entityId) {
        const key = `${entityType}:${entityId}`;
        const data = await redis.hget(this.keyPrefix, key);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Atomically saves or updates an entity version.
     */
    async saveOne(entityType, entityId, record) {
        const key = `${entityType}:${entityId}`;
        await redis.hset(this.keyPrefix, key, JSON.stringify({
            ...record,
            updated_at: new Date().toISOString()
        }));
    }

    /**
     * Bulk save (mostly for migrations or rebuilds)
     */
    async save(versions) {
        const pipeline = redis.pipeline();
        for (const [key, record] of Object.entries(versions)) {
            pipeline.hset(this.keyPrefix, key, JSON.stringify(record));
        }
        await pipeline.exec();
    }

    get isDurable() { return true; }
}

module.exports = new RedisVersionStore();
