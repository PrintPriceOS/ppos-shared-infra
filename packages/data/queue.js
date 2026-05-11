const { Queue } = require('bullmq');
const Redis = require('ioredis');
const { INDUSTRIAL_QUEUE_NAMES } = require('./industrialEvents');

const SecretManager = require('../ops/SecretManager');

const redisUrl = SecretManager.get('REDIS_URL');
const connection = redisUrl
    ? new Redis(redisUrl, { maxRetriesPerRequest: null })
    : new Redis({
        host: SecretManager.get('REDIS_HOST') || 'localhost',
        port: parseInt(SecretManager.get('REDIS_PORT') || '6379', 10),
        password: SecretManager.get('REDIS_PASSWORD') || undefined,
        maxRetriesPerRequest: null,
    });

connection.on('error', (err) => {
    console.error('[SHARED-INFRA][REDIS-ERROR]', err.message);
});

const preflightQueue = new Queue('preflight-v2', { connection });
const autofixQueue = new Queue('autofix-v2', { connection });
const webhookQueue = new Queue('webhooks-v2', { connection });
const batchOrchestratorQueue = new Queue('batch-orchestrate-v2', { connection });
const notificationQueue = new Queue('notifications-v2', { connection });

// Industrial Queues (v1)
const industrialEventsQueue = new Queue(INDUSTRIAL_QUEUE_NAMES.INDUSTRIAL_EVENTS, { connection });
const industrialTelemetryQueue = new Queue(INDUSTRIAL_QUEUE_NAMES.INDUSTRIAL_TELEMETRY, { connection });
const manufacturingDispatchQueue = new Queue(INDUSTRIAL_QUEUE_NAMES.MANUFACTURING_DISPATCH, { connection });
const preflightRequestsQueue = new Queue(INDUSTRIAL_QUEUE_NAMES.PREFLIGHT_REQUESTS, { connection });
const artifactEventsQueue = new Queue(INDUSTRIAL_QUEUE_NAMES.ARTIFACT_EVENTS, { connection });

module.exports = {
    connection,
    preflightQueue,
    autofixQueue,
    webhookQueue,
    batchOrchestratorQueue,
    notificationQueue,
    industrialEventsQueue,
    industrialTelemetryQueue,
    manufacturingDispatchQueue,
    preflightRequestsQueue,
    artifactEventsQueue
};
