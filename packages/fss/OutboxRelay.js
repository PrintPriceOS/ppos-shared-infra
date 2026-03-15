const fs = require('fs');
const path = require('path');
const readline = require('readline');
const eventSigner = require('./EventSigner');
const metricsService = require('../ops/MetricsService');

/**
 * OutboxRelay (Phase 3)
 * Scans the local FSS outbox, signs events, and pushes to remote peers.
 */
class OutboxRelay {
    constructor(config = {}) {
        this.outboxPath = path.join(process.cwd(), '.runtime', 'fss-outbox', 'events.jsonl');
        this.checkpointPath = path.join(process.cwd(), '.runtime', 'fss-outbox', 'checkpoint.json');
        this.destinations = config.destinations || {}; // RegionID -> Endpoint
    }

    /**
     * Executes a sweep of the outbox.
     */
    async sweep() {
        if (!fs.existsSync(this.outboxPath)) {
            return;
        }

        console.log('[FSS-RELAY] Starting sweep...');
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

            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            try {
                const event = JSON.parse(trimmedLine);
                
                // 1. Sign envelope (v1.1)
                const signedEnvelope = eventSigner.sign(event);

                // 2. Broadcast to configured peers
                await this.broadcast(signedEnvelope);

                // 3. Update checkpoint
                this.saveCheckpoint(currentLine);
                
                metricsService.recordRuntimeDecision('fss_relay_sent', true, 'NORMAL', signedEnvelope.origin_region);
            } catch (err) {
                console.error(`[FSS-RELAY] Failed at line ${currentLine}:`, err.message);
                metricsService.recordRuntimeDecision('fss_relay_failed', false, 'DEGRADED', 'local');
                // Stop sweep on critical error
                break;
            }
        }
    }

    /**
     * Pushes a signed envelope to all remote destinations.
     */
    async broadcast(signedEnvelope) {
        const peers = Object.entries(this.destinations);
        if (peers.length === 0) {
            console.log('[FSS-RELAY] No remote destinations configured.');
            return;
        }

        const tasks = peers.map(async ([regionId, endpoint]) => {
            try {
                const response = await fetch(`${endpoint}/fss/relay`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(signedEnvelope)
                });

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`[${regionId}] HTTP ${response.status}: ${text}`);
                }

                console.log(`[FSS-RELAY] Event ${signedEnvelope.event_id} ACKed by ${regionId}`);
            } catch (err) {
                console.error(`[FSS-RELAY] Delivery error to ${regionId}:`, err.message);
                // In production, we'd add to a retry queue here
            }
        });

        await Promise.allSettled(tasks);
    }

    loadCheckpoint() {
        if (fs.existsSync(this.checkpointPath)) {
            try {
                return JSON.parse(fs.readFileSync(this.checkpointPath, 'utf8'));
            } catch (e) {
                console.warn('[FSS-RELAY] Corrupt checkpoint, starting from beginning.');
            }
        }
        return { lastProcessedLine: 0 };
    }

    saveCheckpoint(line) {
        const dir = path.dirname(this.checkpointPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        fs.writeFileSync(this.checkpointPath, JSON.stringify({
            lastProcessedLine: line,
            updated_at: new Date().toISOString()
        }));
    }
}

module.exports = OutboxRelay;
