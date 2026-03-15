const fs = require('fs');
const path = require('path');
const readline = require('readline');
const metricsService = require('../ops/MetricsService');

/**
 * ReplayEngine (Phase 5)
 * Processes the regional inbox and applies events to the local state.
 */
class ReplayEngine {
    constructor(applier) {
        this.inboxPath = path.join(process.cwd(), '.runtime', 'fss-inbox', 'events.jsonl');
        this.checkpointPath = path.join(process.cwd(), '.runtime', 'fss-inbox', 'replay_checkpoint.json');
        this.applier = applier; // Functional applier (Phase 7)
    }

    /**
     * Executes a replay of the inbox.
     */
    async runReplay() {
        if (!fs.existsSync(this.inboxPath)) return;

        console.log('[FSS-REPLAY] Starting replay cycle...');
        const checkpoint = this.loadCheckpoint();
        let currentLine = 0;

        const fileStream = fs.createReadStream(this.inboxPath);
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
                const envelope = JSON.parse(trimmedLine);
                console.log(`[FSS-REPLAY] Applying event ${envelope.event_id} (${envelope.event_name})`);

                // Apply to local state
                if (this.applier) {
                    await this.applier.apply(envelope);
                }

                this.saveCheckpoint(currentLine);
                metricsService.recordRuntimeDecision('fss_replay_applied', true, 'NORMAL', envelope.origin_region);
            } catch (err) {
                console.error(`[FSS-REPLAY] Failed at line ${currentLine}:`, err.message);
                metricsService.recordRuntimeDecision('fss_replay_failed', false, 'DEGRADED', 'local');
                // We don't stop replay on single failure, but log it
            }
        }
        console.log('[FSS-REPLAY] Replay cycle completed.');
    }

    loadCheckpoint() {
        if (fs.existsSync(this.checkpointPath)) {
            return JSON.parse(fs.readFileSync(this.checkpointPath, 'utf8'));
        }
        return { lastProcessedLine: 0 };
    }

    saveCheckpoint(line) {
        fs.writeFileSync(this.checkpointPath, JSON.stringify({
            lastProcessedLine: line,
            updated_at: new Date().toISOString()
        }));
    }
}

module.exports = ReplayEngine;
