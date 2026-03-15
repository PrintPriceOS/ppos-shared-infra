/**
 * @ppos/preflight-service
 * 
 * Industrial HTTP Entrypoint for Preflight Engine.
 * Classification: RUNTIME_SERVICE
 */
const { secretManager } = require('@ppos/shared-infra');
const fastify = require('fastify')({
    logger: {
        level: secretManager.get('LOG_LEVEL') || 'info',
        formatters: {
            level: (label) => { return { level: label.toUpperCase() }; }
        }
    }
});
const path = require('path');
const fs = require('fs-extra');

// Register Plugins
fastify.register(require('@fastify/multipart'), {
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB Industrial limit
    }
});

// Register Routes
fastify.register(require('./routes/health'), { prefix: '/health' });
fastify.register(require('./routes/ready'), { prefix: '/ready' });
fastify.register(require('./routes/diagnostics'), { prefix: '/diagnostics' });
fastify.register(require('./routes/fssTest'), { prefix: '/admin/fss-test' });
fastify.register(require('./routes/analyze'), { prefix: '/analyze' });
fastify.register(require('./routes/autofix'), { prefix: '/autofix' });
fastify.register(require('./routes/metrics'), { prefix: '/metrics' });

// Global Error Handler
fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.status(error.statusCode || 500).send({
        ok: false,
        error: error.code || 'INTERNAL_ERROR',
        message: error.message
    });
});

/**
 * Initialization Logic
 */
const start = async () => {
    try {
        const PORT = secretManager.get('PPOS_PORT') || 3000;
        await fastify.listen({ port: PORT, host: '0.0.0.0' });
        fastify.log.info(`[SERVICE] Preflight Engine HTTP Wrapper active on port ${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
