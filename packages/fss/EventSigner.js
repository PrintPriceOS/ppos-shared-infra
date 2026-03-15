const crypto = require('crypto');
const RegionContext = require('../region/RegionContext');

/**
 * EventSigner (Phase 2)
 * Handles Ed25519 signing of FSS envelopes.
 */
class EventSigner {
    constructor() {
        this.ctx = RegionContext.get();
        // Load keys from environment (MVP) or Secrets (Production)
        this.privateKeyB64 = process.env.PPOS_REGION_PRIVATE_KEY;
        this.keyId = process.env.PPOS_REGION_KEY_ID || `${this.ctx.region_id}-key-v1`;
    }

    /**
     * Signs an envelope using the regional private key.
     * 
     * @param {Object} envelope - The FSS event envelope (v1.1)
     * @returns {Object} The envelope with signature and key_id attached.
     */
    sign(envelope) {
        const privateKeyB64 = process.env.PPOS_REGION_PRIVATE_KEY || this.privateKeyB64;
        const keyId = process.env.PPOS_REGION_KEY_ID || this.keyId;

        if (!privateKeyB64) {
            console.warn('[SIGNER] No private key found. Skipping signature (Federation will be rejected by receivers).');
            return envelope;
        }

        try {
            // 1. Add transport metadata before signing
            envelope.signature_algorithm = 'Ed25519';
            envelope.key_id = keyId;
            envelope.fss_version = '1.1';

            // 2. Create canonical representation (excluding signature)
            const canonicalData = this.getCanonicalData(envelope);

            // 3. Sign bytes
            const privateKey = Buffer.from(privateKeyB64, 'base64');
            const signature = crypto.sign(null, Buffer.from(canonicalData), {
                key: crypto.createPrivateKey({
                    key: privateKey,
                    format: 'der',
                    type: 'pkcs8'
                })
            });

            // 4. Attach signature
            envelope.signature = signature.toString('base64');

            return envelope;
        } catch (err) {
            console.error('[SIGNER] Signing failed:', err.message);
            throw new Error(`Event signing failed: ${err.message}`);
        }
    }

    /**
     * Serializes envelope into a stable, deterministic JSON string.
     * Note: 'signature' field is excluded from canonical string.
     */
    getCanonicalData(envelope) {
        const { signature, ...rest } = envelope;
        // Sort keys to ensure determinism
        return JSON.stringify(rest, Object.keys(rest).sort());
    }
}

module.exports = new EventSigner();
