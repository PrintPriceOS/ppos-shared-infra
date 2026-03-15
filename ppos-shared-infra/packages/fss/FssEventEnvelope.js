/**
 * @ppos/shared-infra - FssEventEnvelope
 * 
 * Defines the canonical structure for Federated State synchronization messages.
 */
const { classifyEntity } = require('../region/stateClassification');
const RegionContext = require('../region/RegionContext');
const { v4: uuidv4 } = require('uuid');

class FssEventEnvelope {
    static build(eventName, entityType, entityId, payload) {
        const context = RegionContext.get();
        
        return {
            fss_version: "1.0",
            event_id: uuidv4(),
            event_name: eventName,
            origin_region: context.region_id,
            entity_type: entityType,
            entity_id: entityId,
            event_timestamp: new Date().toISOString(),
            causality_id: null, // To be implemented with vector clocks/sequences
            classification: classifyEntity(entityType),
            payload: payload,
            signature: null, // Placeholder for Ed25519 signing
            replication_mode: "standard"
        };
    }
}

module.exports = FssEventEnvelope;
