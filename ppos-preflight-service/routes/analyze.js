/**
 * Route: /analyze
 * 
 * Invokes the Shared AnalyzeCommand.
 */
const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const AnalyzeCommand = require('@ppos/preflight-engine/src/runtime/commands/analyzeCommand');
const { metricsService, runtimePolicyResolver } = require('@ppos/shared-infra');

module.exports = async function (fastify, opts) {
    fastify.post('/', async (request, reply) => {
        // Governance Guard: local_analyze
        const governance = runtimePolicyResolver.isActionAllowed('local_analyze');
        if (!governance.allowed) {
            reply.status(503).send({
                ok: false,
                error: 'GOVERNANCE_BLOCK',
                message: governance.reason,
                details: governance
            });
            return;
        }

        const data = await request.file();
        if (!data) {
            reply.status(400).send({ error: 'INPUT_ERROR', message: 'No file uploaded' });
            return;
        }

        const tempId = `up_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const tempPath = path.join(os.tmpdir(), `${tempId}_${data.filename}`);

        try {
            await fs.writeFile(tempPath, await data.toBuffer());

            // Industrial config resolution (defaults)
            const config = {
                minBleedMm: 3.0,
                safeAreaMm: 5.0
            };

            const result = await AnalyzeCommand.run(tempPath, config);

            // H3 Hardening: Record API Metrics (Phase R13)
            metricsService.recordJobResult('ANALYZE_HTTP', 'SUCCEEDED', 'public');

            return {
                ok: true,
                data: result
            };
        } catch (err) {
            fastify.log.error(`[HTTP][ANALYZE] Error: ${err.message}`);
            // H3 Hardening: Record API Failure Metrics (Phase R13)
            metricsService.recordJobResult('ANALYZE_HTTP', 'FAILED', 'public');
            throw err;
        } finally {
            if (await fs.pathExists(tempPath)) {
                await fs.remove(tempPath);
            }
        }
    });
};
