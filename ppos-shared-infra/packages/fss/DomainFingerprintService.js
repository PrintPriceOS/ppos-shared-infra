const crypto = require('crypto');
const conflictDetector = require('./ConflictDetector');

/**
 * DomainFingerprintService (Phase v1.8.0)
 * 
 * Generates fingerprints specifically for individual domains (Policy, Printer, etc.)
 * allowing for targeted drift detection and reconciliation.
 */
class DomainFingerprintService {
    
    async generateDomainDigest(domain) {
        // domain is entity_type (e.g., 'policy', 'printer', 'tenant')
        await conflictDetector.init();
        const versions = conflictDetector.versions; // { "type:id": { version, epoch } }
        
        const domainKeys = Object.keys(versions)
            .filter(key => key.startsWith(`${domain}:`))
            .sort();
        
        const hash = crypto.createHash('sha256');
        domainKeys.forEach(key => {
            const v = versions[key];
            hash.update(`${key}:${v.state_version}:${v.authority_epoch}`);
        });

        return {
            domain,
            count: domainKeys.length,
            fingerprint: hash.digest('hex'),
            timestamp: new Date().toISOString()
        };
    }

    async generateAllDomainsDigests() {
        const domains = ['policy', 'printer', 'tenant', 'matrix'];
        const digests = {};
        for (const dom of domains) {
            digests[dom] = await this.generateDomainDigest(dom);
        }
        return digests;
    }
}

module.exports = new DomainFingerprintService();
