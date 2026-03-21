const Redis = require('ioredis');
const SecretManager = require('../ops/SecretManager');

const redisHost = SecretManager.get('REDIS_HOST') || 'localhost';
const redisPort = SecretManager.get('REDIS_PORT') || '6379';
const redisUrl = SecretManager.get('REDIS_URL') || `redis://${redisHost}:${redisPort}`;

const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true
});

redis.on('error', (err) => {
    console.error('[SHARED-REDIS-ERROR]', err);
});

module.exports = redis;
