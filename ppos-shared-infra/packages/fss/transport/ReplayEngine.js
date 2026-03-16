/**
 * PrintPrice OS — Replay Engine (v1.9.0)
 * 
 * Processes events from the Inbox with Checkpoint awareness.
 */
class ReplayEngine {
    constructor(applier, checkpointStore, inboxStore) {
        this.applier = applier;
        this.checkpointStore = checkpointStore;
        this.inboxStore = inboxStore;
    }

    /**
     * Run an incremental replay for a specific domain.
     */
    async runIncremental(domain) {
        console.log(`[REPLAY-ENGINE] Starting incremental replay for ${domain}...`);
        
        // 1. Get checkpoint
        const regionId = process.env.PPOS_REGION_ID || 'EU-PPOS-1';
        const checkpoint = await this.checkpointStore.getCheckpoint(regionId, domain);
        
        const startFrom = checkpoint ? checkpoint.last_applied_event_id : null;
        console.log(`[REPLAY-ENGINE] Resuming from event: ${startFrom || 'START'}`);

        // 2. Fetch events from Inbox after checkpoint
        const events = await this.inboxStore.getEventsAfter(startFrom, domain);
        
        let successCount = 0;
        let lastAppliedId = startFrom;

        for (const event of events) {
            try {
                await this.applier.apply(event);
                lastAppliedId = event.event_id;
                successCount++;
            } catch (e) {
                console.error(`[REPLAY-ENGINE] Failed to apply event ${event.event_id}: ${e.message}`);
                // In production, we might stop here or quarantine the event
                break;
            }
        }

        // 3. Update checkpoint
        if (successCount > 0) {
            await this.checkpointStore.setCheckpoint(regionId, domain, {
                last_applied_event_id: lastAppliedId,
                last_applied_version: events[successCount - 1].version || 0
            });
        }

        console.log(`[REPLAY-ENGINE] Incremental replay finished. Applied ${successCount} events.`);
        return successCount;
    }
}

module.exports = ReplayEngine;
