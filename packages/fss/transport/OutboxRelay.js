/**
 * @ppos/shared-infra - OutboxRelay
 * 
 * Scans the local outbox and replicates signed events to remote regions.
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const EventSigner = require('./EventSigner');

class OutboxRelay {
    constructor(config) {
        this.outboxPath = path.join(process.cwd(), '.runtime', 'fss-outbox', 'events.jsonl');
        this.checkpointPath = path.join(process.cwd(), '.runtime', 'fss-outbox', 'checkpoint.json');
        this.privateKeyPem = config.privateKeyPem;
        this.destinations = config.destinations; // Map of region_id -> endpoint
    }

    /**
     * Executes one relay sweep.
     */
    async sweep() {
        console.log('[FSS-RELAY] Starting outbox sweep...');
        const checkpoint = this.loadCheckpoint();
        let currentLine = 0;

        const fileStream = fs.createReadStream(this.outboxPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            currentLine++;
            if (currentLine <= checkpoint.lastProcessedLine) continue;

            try {
                const event = JSON.parse(line);
                console.log(`[FSS-RELAY] Processing event ${event.event_id} (${event.event_name})`);
                
                // 1. Sign
                const signedEnvelope = EventSigner.sign(event, this.privateKeyPem);

                // 2. Broadcast to peers
                await this.broadcast(signedEnvelope);

                // 3. Update checkpoint
                this.saveCheckpoint(currentLine);
            } catch (err) {
                console.error(`[FSS-RELAY] Error processing line ${currentLine}: ${err.message}`);
                // In production, we'd implement a backoff or retry queue here
            }
        }
        console.log('[FSS-RELAY] Sweep completed.');
    }

    async broadcast(envelope) {
        for (const [regionId, endpoint] of Object.entries(this.destinations)) {
            try {
                console.log(`[FSS-RELAY] Pushing to ${regionId} @ ${endpoint}`);
                const response = await fetch(`${endpoint}/fss/replicate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(envelope)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }

                console.log(`[FSS-RELAY] ACK received from ${regionId}`);
            } catch (err) {
                console.error(`[FSS-RELAY] Delivery failed to ${regionId}: ${err.message}`);
            }
        }
    }

    loadCheckpoint() {
        if (fs.existsSync(this.checkpointPath)) {
            return JSON.parse(fs.readFileSync(this.checkpointPath, 'utf8'));
        }
        return { lastProcessedLine: 0 };
    }

    saveCheckpoint(line) {
        fs.writeFileSync(this.checkpointPath, JSON.stringify({ lastProcessedLine: line, updated_at: new Date().toISOString() }));
    }
}

module.exports = OutboxRelay;
