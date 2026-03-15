const crypto = require('crypto');

/**
 * SignatureVerifier (Phase 2)
 * Verifies Ed25519 signatures on FSS envelopes.
 */
class SignatureVerifier {
    constructor() {
        // MVP: Hardcoded key registry. 
        // In production, this would be fetched from a discovery service or Control Plane.
        this.publicKeyRegistry = new Map();
        
        if (process.env.PPOS_REMOTES_PUBLIC_KEYS) {
            try {
                const remotes = JSON.parse(process.env.PPOS_REMOTES_PUBLIC_KEYS);
                Object.entries(remotes).forEach(([regionId, keyB64]) => {
                    this.publicKeyRegistry.set(regionId, keyB64);
                });
            } catch (e) {
                console.error('[VERIFIER] Failed to parse remote public keys:', e.message);
            }
        }
    }

    /**
     * Verifies the signature of an envelope.
     * 
     * @param {Object} envelope 
     * @returns {boolean}
     */
    verify(envelope) {
        if (!envelope.signature || !envelope.origin_region) {
            console.error('[VERIFIER] Missing signature or origin_region');
            return false;
        }

        const publicKeyB64 = this.publicKeyRegistry.get(envelope.origin_region);
        if (!publicKeyB64) {
            console.error(`[VERIFIER] No public key found for region: ${envelope.origin_region}`);
            return false;
        }

        try {
            const signature = Buffer.from(envelope.signature, 'base64');
            const canonicalData = this.getCanonicalData(envelope);
            const publicKey = Buffer.from(publicKeyB64, 'base64');

            const isVerified = crypto.verify(null, Buffer.from(canonicalData), {
                key: crypto.createPublicKey({
                    key: publicKey,
                    format: 'der',
                    type: 'spki'
                })
            }, signature);

            return isVerified;
        } catch (err) {
            console.error('[VERIFIER] Verification error:', err.message);
            return false;
        }
    }

    /**
     * Re-creates the canonical data used for signing.
     */
    getCanonicalData(envelope) {
        const { signature, ...rest } = envelope;
        return JSON.stringify(rest, Object.keys(rest).sort());
    }

    /**
     * Helper to manually add a key to the registry (for tests)
     */
    registerKey(regionId, publicKeyB64) {
        this.publicKeyRegistry.set(regionId, publicKeyB64);
    }
}

module.exports = new SignatureVerifier();
