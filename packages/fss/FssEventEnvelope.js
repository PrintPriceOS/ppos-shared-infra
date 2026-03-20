/**
 * @ppos/shared-infra - FssEventEnvelope
 * 
 * Defines the canonical structure for Federated State synchronization messages.
 */
const { classifyEntity } = require('../region/stateClassification');
const RegionContext = require('../region/RegionContext');
const { v4: uuidv4 } = require('uuid');

const crypto = require('crypto');

class FssEventEnvelope {
    static build(eventName, entityType, entityId, payload, options = {}) {
        const context = RegionContext.get();
        const payloadStr = JSON.stringify(payload);
        const payloadHash = crypto.createHash('sha256').update(payloadStr).digest('hex');
        
        return {
            fss_version: "1.6",
            event_id: uuidv4(),
            event_name: eventName,
            event_type: eventName, // Alias for v1.6 compliance
            origin_region: context.region_id,
            region_origin: context.region_id, // Alias for v1.6 compliance
            entity_type: entityType,
            entity_id: entityId,
            event_timestamp: new Date().toISOString(),
            occurred_at: new Date().toISOString(), // Alias for v1.6 compliance
            authority_epoch: options.authority_epoch || 1, // Phase 6: Default to 1
            state_version: options.state_version || 1,    // Phase 6: Default to 1
            authority_scope: options.authority_scope || "REGIONAL",
            payload_hash: payloadHash,
            causality_id: null,
            classification: classifyEntity(entityType),
            payload: payload,
            signature: null,
            replication_mode: "standard",
            runtime_governance: payload._governance || {
                mode: "NORMAL",
                authority: "authoritative"
            }
        };
    }
}

module.exports = FssEventEnvelope;
