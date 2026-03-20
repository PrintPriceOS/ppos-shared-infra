const db = require('../data/db');
const { webhookQueue } = require('../data/queue');

async function dispatchWebhook(tenantId, eventType, payload) {
    try {
        const { rows: hooks } = await db.query(
            'SELECT url, secret_key FROM webhooks WHERE tenant_id = ? AND event_type = ? AND active = TRUE',
            [tenantId, eventType]
        );

        if (hooks.length === 0) return;

        const dispatches = hooks.map(hook => {
            return webhookQueue.add(eventType, {
                url: hook.url,
                eventType,
                payload,
                secretKey: hook.secret_key,
                tenantId
            }, {
                attempts: 5,
                backoff: { type: 'exponential', delay: 10000 },
                removeOnComplete: true,
                removeOnFail: false,
            });
        });

        await Promise.all(dispatches);
    } catch (err) {
        console.error('[SHARED-INFRA][WEBHOOK-DISPATCH] Failed:', err.message);
    }
}

module.exports = { dispatchWebhook };
