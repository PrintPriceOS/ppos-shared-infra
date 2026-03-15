/**
 * Route: /admin/fss-test
 * 
 * Internal route to test Multi-Region Awareness and FSS publication.
 */
const { fssAdapter, regionContext, runtimePolicyResolver } = require('@ppos/shared-infra');

module.exports = async function (fastify, opts) {
    fastify.addHook('preHandler', async (request, reply) => {
        // All FSS test actions require fresh cache and non-isolated mode
        const governance = runtimePolicyResolver.isActionAllowed('cross_region_publish');
        if (!governance.allowed) {
            reply.status(governance.mode === 'EMERGENCY_RESTRICTIVE' ? 403 : 503).send({
                ok: false,
                error: 'GOVERNANCE_BLOCK',
                message: governance.reason,
                details: governance
            });
        }
    });

    fastify.post('/publish-printer', async (request, reply) => {
        const printer = request.body || { id: 'test-printer-001', name: 'InkJet Pro 5000' };
        
        const result = await fssAdapter.publishPrinterIdentityEvent(printer);
        
        return {
            ok: result.ok,
            event_id: result.event_id,
            error: result.error,
            context: regionContext.get()
        };
    });

    fastify.post('/publish-unsafe', async (request, reply) => {
        const unsafePayload = {
            id: 'unsafe-001',
            local_path: 'C:\\Users\\Admin\\Desktop\\job.pdf'
        };

        const result = await fssAdapter.publishGlobalEvent('UnsafeEvent', 'uploaded_pdf', 'unsafe-001', unsafePayload);

        return {
            ok: result.ok,
            error: result.error
        };
    });
};
