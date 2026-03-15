/**
 * Route: /admin/fss-test
 * 
 * Internal route to test Multi-Region Awareness and FSS publication.
 */
const { fssAdapter, regionContext } = require('@ppos/shared-infra');

module.exports = async function (fastify, opts) {
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
