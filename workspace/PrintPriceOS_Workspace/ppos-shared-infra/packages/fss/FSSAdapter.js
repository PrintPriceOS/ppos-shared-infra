/**
 * @ppos/shared-infra - FSSAdapter
 * 
 * Stable interface for publishing global state changes.
 * MVP Implementation: Writes to a local append-only outbox for later replay.
 */
const fs = require('fs');
const path = require('path');
const RegionContext = require('../region/RegionContext');
const RegionFilter = require('../region/RegionFilter');
const FssEventEnvelope = require('./FssEventEnvelope');
const runtimePolicyResolver = require('../federation/RuntimePolicyResolver');

class FSSAdapter {
    constructor() {
        this.ctx = RegionContext.get();
        this.outboxDir = path.join(process.cwd(), '.runtime', 'fss-outbox');
        this.outboxPath = path.join(this.outboxDir, 'events.jsonl');
        
        if (!fs.existsSync(this.outboxDir)) {
            fs.mkdirSync(this.outboxDir, { recursive: true });
        }
    }

    /**
     * Publishes a global event following compliance and classification rules.
     */
    async publishGlobalEvent(eventName, entityType, entityId, payload) {
        try {
            console.log(`[FSS-ADAPTER] Attempting publish: ${eventName} (${entityType}:${entityId})`);
            
            // 0. Runtime Governance Gate (Phase 24.H)
            const actionMap = {
                'PolicyPublished': 'policy_publish',
                'PrinterNodeRegistered': 'printer_onboarding',
                'RegionHealthSummaryPublished': 'health_status_pub'
            };
            const actionKey = actionMap[eventName] || 'cross_region_publish';
            const decision = runtimePolicyResolver.isActionAllowed(actionKey);

            if (!decision.allowed) {
                throw new Error(`Governance publication block: ${decision.reason} (${decision.mode})`);
            }

            // 1. Compliance Check
            RegionFilter.assertReplicable(entityType, payload);

            // 2. Sanitization
            const cleanPayload = RegionFilter.sanitizeForGlobalSync(entityType, payload);
            
            // Inject runtime decision metadata for auditability
            cleanPayload._governance = {
                mode: decision.mode,
                authority: decision.authority_status,
                decision: 'allowed',
                reason: decision.reason
            };

            // 3. Build Envelope
            const envelope = FssEventEnvelope.build(eventName, entityType, entityId, cleanPayload);

            // 4. Persistence (Local Outbox Stub)
            fs.appendFileSync(this.outboxPath, JSON.stringify(envelope) + '\n');

            console.log(`[FSS-ADAPTER] SUCCESS: Event ${envelope.event_id} appended to outbox.`);
            return { ok: true, event_id: envelope.event_id };

        } catch (err) {
            console.error(`[FSS-ADAPTER] PUBLISH_DENIED: ${err.message}`);
            return { ok: false, error: err.message };
        }
    }

    // Specialized Helpers
    async publishPolicyEvent(policy) {
        return this.publishGlobalEvent('PolicyPublished', 'governance_policy', policy.id, policy);
    }

    async publishPrinterIdentityEvent(printer) {
        return this.publishGlobalEvent('PrinterNodeRegistered', 'printer_node', printer.id, printer);
    }

    async publishRegionHealthSummary(health) {
        return this.publishGlobalEvent('RegionHealthSummaryPublished', 'region_health_summary', this.ctx.region_id, health);
    }
}

module.exports = new FSSAdapter();
