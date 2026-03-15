/**
 * @ppos/shared-infra - EventSigner
 * 
 * Provides Ed25519 signing and verification for FSS Envelopes.
 */
const crypto = require('crypto');

class EventSigner {
    /**
     * Signs an event envelope.
     * @param {Object} envelope - The FSS envelope to sign.
     * @param {string} privateKeyPem - The regional private key in PEM format.
     */
    static sign(envelope, privateKeyPem) {
        // Create deterministic payload for signing (exclude existing signature)
        const { signature, ...body } = envelope;
        const payload = JSON.stringify(body);
        
        const privateKey = crypto.createPrivateKey(privateKeyPem);
        
        const signatureBuffer = crypto.sign(null, Buffer.from(payload), privateKey);
        
        return {
            ...envelope,
            signature: signatureBuffer.toString('base64'),
            signature_algorithm: 'Ed25519'
        };
    }

    /**
     * Verifies an event envelope signature.
     * @param {Object} envelope - The FSS envelope to verify.
     * @param {string} publicKeyPem - The public key of the origin region.
     */
    static verify(envelope, publicKeyPem) {
        if (!envelope.signature) return false;

        const { signature, signature_algorithm, ...body } = envelope;
        const payload = JSON.stringify(body);
        
        const publicKey = crypto.createPublicKey(publicKeyPem);
        
        return crypto.verify(
            null, 
            Buffer.from(payload), 
            publicKey, 
            Buffer.from(signature, 'base64')
        );
    }
}

module.exports = EventSigner;
