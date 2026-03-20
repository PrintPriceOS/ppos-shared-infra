const policyEnforcementService = require('../governance/policyEnforcementService');
const printerRegistryService = require('../federation/printerRegistryService');
const federatedAuth = require('./FederatedAuthorizationService');

/**
 * EventApplicationMVP (Phase 7)
 * Applies side-effects of federated events to the local regional state.
 */
class EventApplicationMVP {
    /**
     * Routes the event to the appropriate handler.
     */
    async apply(envelope) {
        const { event_name, origin_region, payload, event_id } = envelope;

        // Re-verify authority before applying side-effects (Defense in Depth)
        if (!federatedAuth.isAuthorized(origin_region, event_name)) {
            throw new Error(`Unauthorized application attempt: ${origin_region} tried to emit ${event_name}`);
        }

        console.log(`[FSS-APPLIER] Applying ${event_name} from ${origin_region} (ID: ${event_id})`);

        switch (event_name) {
            case 'PolicyPublished':
                await this.handlePolicyPublished(payload);
                break;
            case 'PrinterNodeRegistered':
                await this.handlePrinterRegistered(payload);
                break;
            case 'RegionHealthSummaryPublished':
                await this.handleRegionHealth(origin_region, payload);
                break;
            default:
                console.log(`[FSS-APPLIER] No handler for event: ${event_name}. Marking as processed.`);
        }
    }

    /**
     * Updates local policy cache with global policy broadcast.
     */
    async handlePolicyPublished(payload) {
        console.log('[FSS-APPLIER] Updating global policy state...');
        // In MVP, we trigger a global invalidation to force re-fetch from the global source
        // or we could UPSERT the payload into governance_policies table.
        // For Phase 7, we'll assume a cache invalidation is enough to trigger sync.
        policyEnforcementService.invalidateCache();
    }

    /**
     * Synchronizes printer identities across regions.
     */
    async handlePrinterRegistered(payload) {
        console.log(`[FSS-APPLIER] Syncing printer node: ${payload.id || payload.printerId}`);
        await printerRegistryService.registerPrinter(payload);
    }

    /**
     * Updates regional view of remote health.
     */
    async handleRegionHealth(regionId, payload) {
        console.log(`[FSS-APPLIER] Region ${regionId} reported health: ${payload.status}`);
        // Store in a local redis/db summary for the Cockpit
    }
}

module.exports = new EventApplicationMVP();
