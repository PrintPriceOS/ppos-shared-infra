/**
 * Route: /ready
 * 
 * Validates external dependencies and system readiness.
 * Part of R13 Hardening & Industrial CI/CD.
 */
const { Ghostscript } = require('@ppos/preflight-engine');
const { db, redis } = require('@ppos/shared-infra');
const os = require('os');
const fs = require('fs-extra');

module.exports = async function (fastify, opts) {
    fastify.get('/', async (request, reply) => {
        const checks = {
            engine: true,
            ghostscript: false,
            temp_dir: false,
            db: false,
            redis: false
        };

        try {
            // 1. Ghostscript check
            try {
                const gs = new Ghostscript();
                checks.ghostscript = true;
            } catch (e) {}

            // 2. Temp directory check
            try {
                const tempDir = process.env.PPOS_TEMP_DIR || os.tmpdir();
                await fs.ensureDir(tempDir);
                const testFile = `${tempDir}/ready_test_${Date.now()}`;
                await fs.writeFile(testFile, 'test');
                await fs.remove(testFile);
                checks.temp_dir = true;
            } catch (e) {}

            // 3. Database check
            try {
                const [rows] = await db.query('SELECT 1 as ok');
                if (rows && rows[0].ok === 1) {
                    checks.db = true;
                }
            } catch (e) {}

            // 4. Redis check
            try {
                const pong = await redis.ping();
                if (pong === 'PONG') {
                    checks.redis = true;
                }
            } catch (e) {}

            const ready = Object.values(checks).every(v => v === true);

            if (!ready) {
                reply.status(503);
            }

            return {
                status: ready ? 'READY' : 'DEGRADED',
                ready,
                checks,
                timestamp: new Date().toISOString()
            };
        } catch (err) {
            reply.status(503);
            return {
                status: 'ERROR',
                ready: false,
                error: err.message,
                checks,
                timestamp: new Date().toISOString()
            };
        }
    });
};
