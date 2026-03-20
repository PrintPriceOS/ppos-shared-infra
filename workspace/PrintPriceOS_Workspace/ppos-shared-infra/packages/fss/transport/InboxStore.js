/**
 * @ppos/shared-infra - InboxStore
 * 
 * Manages the regional reception log (Inbox) for federated events.
 */
const fs = require('fs');
const path = require('path');

class InboxStore {
    constructor() {
        this.inboxDir = path.join(process.cwd(), '.runtime', 'fss-inbox');
        this.inboxPath = path.join(this.inboxDir, 'events.jsonl');
        this.dedupePath = path.join(this.inboxDir, 'dedupe_index.json');
        
        if (!fs.existsSync(this.inboxDir)) {
            fs.mkdirSync(this.inboxDir, { recursive: true });
        }
    }

    /**
     * Appends a verified event to the inbox.
     */
    async store(envelope) {
        // 1. Deduplication
        if (this.isDuplicate(envelope.event_id)) {
            return { ok: true, status: 'DUPLICATE' };
        }

        // 2. Append to log
        const record = {
            ...envelope,
            received_at: new Date().toISOString(),
            process_status: 'RECEIVED'
        };

        fs.appendFileSync(this.inboxPath, JSON.stringify(record) + '\n');
        
        // 3. Update index
        this.addToIndex(envelope.event_id);

        return { ok: true, status: 'ACCEPTED' };
    }

    isDuplicate(eventId) {
        const index = this.loadIndex();
        return !!index[eventId];
    }

    loadIndex() {
        if (fs.existsSync(this.dedupePath)) {
            return JSON.parse(fs.readFileSync(this.dedupePath, 'utf8'));
        }
        return {};
    }

    addToIndex(eventId) {
        const index = this.loadIndex();
        index[eventId] = new Date().toISOString();
        // Simple file sync for MVP. In production, use Redis Bloom Filter.
        fs.writeFileSync(this.dedupePath, JSON.stringify(index));
    }
}

module.exports = new InboxStore();
