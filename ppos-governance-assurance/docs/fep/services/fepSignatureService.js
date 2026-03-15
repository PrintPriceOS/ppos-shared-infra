// Minimal signature verification stub — replace with real crypto + key resolution per CANONICAL_SIGNING.md

const allowedAlgos = ['ECDSA+SHA256', 'RSASSA-PSS+SHA256'];

function verifyMessageSignature(envelope, trustStore = {}) {
  const sig = envelope && envelope.signature;
  if (!sig) return { valid: false, reason: 'missing_signature' };

  if (!allowedAlgos.includes(sig.algorithm)) {
    return { valid: false, reason: 'unsupported_algorithm' };
  }

  const createdAt = sig.createdAt ? new Date(sig.createdAt) : null;
  if (!createdAt || isNaN(createdAt.getTime())) return { valid: false, reason: 'invalid_createdAt' };

  const key = trustStore[sig.keyId];
  if (!key) return { valid: false, reason: 'key_not_found' };

  // Placeholder verification: in tests provide signature.signatureValue === 'VALID'
  if (sig.signatureValue === 'VALID') {
    return { valid: true, reason: 'ok', signingNodeId: sig.signingNodeId || sig.signingNode, algorithm: sig.algorithm };
  }

  return { valid: false, reason: 'signature_invalid' };
}

module.exports = {
  verifyMessageSignature
};
