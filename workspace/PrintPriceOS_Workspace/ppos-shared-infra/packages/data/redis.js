const Redis = require('ioredis');
const SecretManager = require('../ops/SecretManager');

const redisUrl = SecretManager.get('REDIS_URL') || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true
});

redis.on('error', (err) => {
    console.error('[SHARED-REDIS-ERROR]', err);
});

module.exports = redis;
