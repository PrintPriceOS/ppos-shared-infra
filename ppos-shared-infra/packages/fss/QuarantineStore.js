const fs = require('fs');
const path = require('path');

/**
 * QuarantineStore (Phase v1.6.0)
 * 
 * Manages events that were verified and authorized but failed application logic,
 * are out of order, or have conflicting versioning.
 */
class QuarantineStore {
    constructor() {
        this.quarantineDir = path.join(process.cwd(), '.runtime', 'fss-quarantine-v2');
        if (!fs.existsSync(this.quarantineDir)) {
            fs.mkdirSync(this.quarantineDir, { recursive: true });
        }
    }

    /**
     * Moves an event to quarantine with a reason.
     */
    async quarantine(envelope, reasonCode, details = {}) {
        const entry = {
            event_id: envelope.event_id,
            event_name: envelope.event_name,
            reason_code: reasonCode,
            quarantined_at: new Date().toISOString(),
            retryable: details.retryable !== undefined ? details.retryable : true,
            resolution_status: 'PENDING',
            details,
            envelope
        };

        const filePath = path.join(this.quarantineDir, `${envelope.event_id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));
        
        console.warn(`[FSS-QUARANTINE] Event ${envelope.event_id} quarantined: ${reasonCode}`);
    }

    /**
     * Lists all quarantined events.
     */
    list() {
        return fs.readdirSync(this.quarantineDir)
            .filter(f => f.endsWith('.json'))
            .map(f => {
                const content = fs.readFileSync(path.join(this.quarantineDir, f), 'utf8');
                return JSON.parse(content);
            });
    }

    /**
     * Removes an event from quarantine (e.g., after successful retry/fix).
     */
    async remove(eventId) {
        const filePath = path.join(this.quarantineDir, `${eventId}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

module.exports = new QuarantineStore();
