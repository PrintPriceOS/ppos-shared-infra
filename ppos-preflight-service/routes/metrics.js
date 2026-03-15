// ppos-preflight-service/routes/metrics.js
const { metricsService } = require('@ppos/shared-infra');

/**
 * Metrics Route (Phase R13 - H3)
 * Exposes internal platform telemetry to Prometheus.
 */
async function routes(fastify, options) {
    fastify.get('/', async (request, reply) => {
        try {
            const metrics = await metricsService.getMetrics();
            reply
                .type(metricsService.contentType)
                .send(metrics);
        } catch (err) {
            fastify.log.error('[METRICS-ERROR]', err.message);
            reply.status(500).send({ error: 'Failed to collect metrics' });
        }
    });
}

module.exports = routes;
