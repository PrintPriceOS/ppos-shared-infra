/**
 * Route: /fss/replicate
 * 
 * Regional endpoint to receive federated state updates from peers.
 */
const { fssReceiver } = require('../../ppos-shared-infra/fss_facade');

module.exports = async function (fastify, opts) {
    fastify.post('/replicate', async (request, reply) => {
        const envelope = request.body;

        try {
            const result = await fssReceiver.receive(envelope);

            if (result.status === 'REJECTED') {
                return reply.code(401).send({ error: result.reason });
            }

            if (result.status === 'QUARANTINED') {
                return reply.code(202).send({ status: 'QUARANTINED', reason: result.reason });
            }

            return { ok: true, status: result.status };
        } catch (err) {
            fastify.log.error(`[FSS-RECEIVER] Internal Error: ${err.message}`);
            return reply.code(500).send({ error: 'Internal Federation Error' });
        }
    });
};
