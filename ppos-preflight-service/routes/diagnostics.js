/**
 * Route: /diagnostics
 * 
 * Deep internal status for industrial operations.
 * Restricted to administrative use.
 */
const os = require('os');
const { secretManager } = require('@ppos/shared-infra');

module.exports = async function (fastify, opts) {
    fastify.get('/', async (request, reply) => {
        // Simple API Key Protection for Diagnostics
        const apiKey = request.headers['x-api-key'];
        const masterKey = secretManager.get('ADMIN_API_KEY');

        if (masterKey && apiKey !== masterKey) {
            reply.status(401);
            return { error: 'UNAUTHORIZED_DIAGNOSTICS' };
        }

        return {
            system: {
                platform: process.platform,
                arch: process.arch,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpus: os.cpus().length,
                load: os.loadavg()
            },
            environment: {
                node_env: process.env.NODE_ENV,
                ppos_home: process.env.PPOS_HOME,
                ppos_port: process.env.PPOS_PORT
            },
            runtime: {
                pid: process.pid,
                version: process.version,
                dependencies: require('../package.json').dependencies
            },
            timestamp: new Date().toISOString()
        };
    });
};
