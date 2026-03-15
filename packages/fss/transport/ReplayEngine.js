/**
 * @ppos/shared-infra - ReplayEngine
 * 
 * Orchestrates the idempotent application of events from the inbox.
 */
const fs = require('fs');
const readline = require('readline');
const path = require('path');

class ReplayEngine {
    constructor(applier) {
        this.inboxPath = path.join(process.cwd(), '.runtime', 'fss-inbox', 'events.jsonl');
        this.checkpointPath = path.join(process.cwd(), '.runtime', 'fss-inbox', 'apply_checkpoint.json');
        this.applier = applier; // Target logic for applying state
    }

    async run() {
        console.log('[FSS-REPLAY] Starting application sweep...');
        const checkpoint = this.loadCheckpoint();
        let currentLine = 0;

        if (!fs.existsSync(this.inboxPath)) return;

        const rl = readline.createInterface({
            input: fs.createReadStream(this.inboxPath),
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            currentLine++;
            if (currentLine <= checkpoint.lastAppliedLine) continue;

            const event = JSON.parse(line);
            
            try {
                console.log(`[FSS-REPLAY] Applying ${event.event_id} | ${event.event_name}`);
                const applied = await this.applier.apply(event);
                
                if (applied) {
                    this.saveCheckpoint(currentLine);
                }
            } catch (err) {
                console.error(`[FSS-REPLAY] Failed to apply ${event.event_id}: ${err.message}`);
            }
        }
        console.log('[FSS-REPLAY] Application sweep finished.');
    }

    loadCheckpoint() {
        if (fs.existsSync(this.checkpointPath)) {
            return JSON.parse(fs.readFileSync(this.checkpointPath, 'utf8'));
        }
        return { lastAppliedLine: 0 };
    }

    saveCheckpoint(line) {
        fs.writeFileSync(this.checkpointPath, JSON.stringify({ lastAppliedLine: line, updated_at: new Date().toISOString() }));
    }
}

module.exports = ReplayEngine;
