const crypto = require('crypto');
const conflictDetector = require('./ConflictDetector');

/**
 * DriftInspector (Phase v1.6.0)
 * 
 * Provides tools to detect state divergence between regions.
 * Generates regional state digests that can be compared to identify "drift".
 */
class DriftInspector {
    /**
     * Generates a structural digest of the current regional state.
     * Includes counts and a cumulative hash of entity versions.
     */
    generateStateDigest() {
        const versions = conflictDetector.versions; // { "type:id": { version, epoch } }
        const sortedKeys = Object.keys(versions).sort();
        
        const summary = {
            region_id: process.env.PPOS_REGION_ID,
            timestamp: new Date().toISOString(),
            entity_count: sortedKeys.length,
            classes: {}
        };

        // Classify and aggregate
        sortedKeys.forEach(key => {
            const [type] = key.split(':');
            summary.classes[type] = (summary.classes[type] || 0) + 1;
        });

        // Compute holistic hash of state versions
        const hash = crypto.createHash('sha256');
        sortedKeys.forEach(key => {
            const v = versions[key];
            hash.update(`${key}:${v.state_version}:${v.authority_epoch}`);
        });
        
        summary.state_fingerprint = hash.digest('hex');

        return summary;
    }

    /**
     * Compares local digest with a remote one to find divergence.
     */
    inspectDrift(remoteDigest) {
        const local = this.generateStateDigest();
        const hasDrift = local.state_fingerprint !== remoteDigest.state_fingerprint;

        return {
            has_drift: hasDrift,
            local_fingerprint: local.state_fingerprint,
            remote_fingerprint: remoteDigest.state_fingerprint,
            detected_at: new Date().toISOString()
        };
    }
}

module.exports = new DriftInspector();
