const Redis = require('ioredis');
const path = require('path');
const { secretManager } = require('@ppos/shared-infra');

const redisUrl = secretManager.get('REDIS_URL');
const redis = redisUrl 
    ? new Redis(redisUrl, { maxRetriesPerRequest: null, enableReadyCheck: true })
    : new Redis({
        host: secretManager.get('REDIS_HOST') || 'localhost',
        port: parseInt(secretManager.get('REDIS_PORT') || '6379', 10),
        password: secretManager.get('REDIS_PASSWORD') || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: true
    });

redis.on('error', (err) => {
    console.error('[REDIS-ERROR]', err);
});

module.exports = redis;
