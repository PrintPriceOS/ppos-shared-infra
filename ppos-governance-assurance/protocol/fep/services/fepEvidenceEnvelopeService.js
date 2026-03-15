// Minimal validator / helper for evidence envelopes
const Ajv = require('ajv').default || require('ajv');
const path = require('path');
const schema = require('../schemas/fep.evidence_envelope.schema.json');

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

function validateEvidenceEnvelope(envelope) {
  const valid = validate(envelope);
  return {
    valid: !!valid,
    errors: valid ? [] : (validate.errors || [])
  };
}

function normalizeEvidenceEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'object') return null;
  const normalized = JSON.parse(JSON.stringify(envelope));

  if (normalized.generatedAt) {
    const d = new Date(normalized.generatedAt);
    if (!isNaN(d.getTime())) {
      normalized.generatedAt = d.toISOString().replace(/\.\d{3}Z$/, 'Z');
    }
  }

  normalized.traceRefs = Array.isArray(normalized.traceRefs) ? normalized.traceRefs : [];
  normalized.artifacts = Array.isArray(normalized.artifacts) ? normalized.artifacts : [];

  return normalized;
}

module.exports = {
  validateEvidenceEnvelope,
  normalizeEvidenceEnvelope
};
