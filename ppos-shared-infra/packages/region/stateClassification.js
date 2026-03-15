/**
 * @ppos/shared-infra - State Classification
 * 
 * Defines metadata-driven replication rules for across-region synchronization.
 */

const CLASSIFICATIONS = {
    GLOBAL: 'GLOBAL',       // Replicatable to all nodes
    REGIONAL: 'REGIONAL',   // Strictly local
    DERIVED: 'DERIVED',     // Summary/Redacted replication allowed
    EPHEMERAL: 'EPHEMERAL'  // No replication, short-lived
};

const ENTITY_MAP = {
    'organization': CLASSIFICATIONS.GLOBAL,
    'governance_policy': CLASSIFICATIONS.GLOBAL,
    'printer_node': CLASSIFICATIONS.GLOBAL,
    'printer_capability': CLASSIFICATIONS.GLOBAL,
    'region_health_summary': CLASSIFICATIONS.GLOBAL,
    'job_metadata': CLASSIFICATIONS.DERIVED,
    'job_payload': CLASSIFICATIONS.REGIONAL,
    'uploaded_pdf': CLASSIFICATIONS.REGIONAL,
    'quarantine_asset': CLASSIFICATIONS.REGIONAL,
    'audit_event': CLASSIFICATIONS.DERIVED,     // Sanitized global replication allowed
    'market_summary': CLASSIFICATIONS.GLOBAL
};

function classifyEntity(entityType) {
    return ENTITY_MAP[entityType] || CLASSIFICATIONS.REGIONAL;
}

function isGloballyReplicable(entityType) {
    const classification = classifyEntity(entityType);
    return classification === CLASSIFICATIONS.GLOBAL || classification === CLASSIFICATIONS.DERIVED;
}

function isRegionRestricted(entityType) {
    return classifyEntity(entityType) === CLASSIFICATIONS.REGIONAL;
}

module.exports = {
    CLASSIFICATIONS,
    classifyEntity,
    isGloballyReplicable,
    isRegionRestricted
};
