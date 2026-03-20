const db = require('../data/db');
const { v4: uuidv4 } = require('uuid');
const queue = require('../data/queue');

class NotifierService {
    constructor(registry) {
        this.registry = registry;
    }

    async notifyTenantEvent({ tenantId, eventType, payload, channelOverride, dedupeContext = '' }) {
        const config = this.registry.getEventConfig(eventType);
        if (!config) {
            console.warn(`[SHARED-INFRA][NOTIFIER] Unknown event type: ${eventType}`);
            return { status: 'invalid', message: 'Unknown event type' };
        }
        const channel = channelOverride || config.channel;

        try {
            const { rows: [prefs] } = await db.query(
                'SELECT * FROM tenant_notification_preferences WHERE tenant_id = ?',
                [tenantId]
            );

            const prefField = eventType.replace('.', '_') + '_email';
            if (prefs && prefs[prefField] === 0) {
                return { status: 'suppressed', reason: 'User preference' };
            }

            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const dedupeKey = `tenant:${tenantId}:event:${eventType}:context:${dedupeContext}:window:${dateStr}`;

            const { rows: [existing] } = await db.query(
                'SELECT id FROM notifications WHERE dedupe_key = ? AND created_at > NOW() - INTERVAL ? HOUR',
                [dedupeKey, config.dedupe_window_hours || 24]
            );

            if (existing) {
                return { status: 'duplicate', id: existing.id };
            }

            const notificationId = uuidv4();
            await db.query(`
                INSERT INTO notifications (
                    id, tenant_id, event_type, channel, status, dedupe_key, subject, payload_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [notificationId, tenantId, eventType, channel, 'PENDING', dedupeKey, config.subject, JSON.stringify(payload)]);

            await queue.notificationQueue.add('deliver', { notificationId });
            return { status: 'created', id: notificationId };
        } catch (err) {
            console.error('[SHARED-INFRA][NOTIFIER] failed:', err.message);
            throw err;
        }
    }
}

module.exports = NotifierService;
