/**
 * @ppos/shared-infra - RegionFilter
 * 
 * Compliance guard to prevent regional data leakage in FSS publication.
 */
const { isRegionRestricted, classifyEntity } = require('./stateClassification');

class RegionFilter {
    /**
     * Inspects a payload and asserts it is safe for global replication.
     */
    assertReplicable(entityType, payload) {
        if (isRegionRestricted(entityType)) {
            throw new Error(`[COMPLIANCE-BLOCK] Entity type '${entityType}' is restricted to its home region.`);
        }

        // Hard check for common binary/path indicators in global payloads
        const payloadStr = JSON.stringify(payload);
        const forbiddenPatterns = [
            /\"C:\\\\Users/i,
            /\/home\//i,
            /\.pdf\"/i,
            /\"raw_data\"/i,
            /\"quarantine_path\"/i
        ];

        for (const pattern of forbiddenPatterns) {
            if (pattern.test(payloadStr)) {
                throw new Error(`[COMPLIANCE-BLOCK] Payload for '${entityType}' contains regional-only data patterns.`);
            }
        }

        return true;
    }

    /**
     * Redacts unsafe fields from a payload.
     */
    sanitizeForGlobalSync(entityType, payload) {
        const classification = classifyEntity(entityType);
        
        if (classification === 'REGIONAL') return null;

        const sanitized = { ...payload };

        // Auto-redact common sensitive patterns
        const sensitiveKeys = ['local_path', 'secret', 'customer_id', 'raw_node_ip'];
        
        Object.keys(sanitized).forEach(key => {
            if (sensitiveKeys.includes(key) || key.endsWith('_local')) {
                delete sanitized[key];
            }
        });

        return sanitized;
    }
}

module.exports = new RegionFilter();
