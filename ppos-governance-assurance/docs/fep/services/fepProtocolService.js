const { validateEvidenceEnvelope, normalizeEvidenceEnvelope } = require('./fepEvidenceEnvelopeService');
const { verifyMessageSignature } = require('./fepSignatureService');
const { checkAndStore } = require('./messageIdStore');
const auditTrailBuilder = require('../../../services/auditTrailBuilder');
const auditStore = require('../../../services/auditStore');

/**
 * validateFepMessage(input)
 * input: {
 *   protocolProfile,
 *   messageEnvelope,
 *   senderNode,
 *   receiverNode,
 *   trustState,
 *   governanceState,
 *   policy
 * }
 */
function validateFepMessage(input) {
  const {
    protocolProfile,
    messageEnvelope = {},
    senderNode,
    receiverNode,
    trustState,
    governanceState,
    policy = {},
    trustStore = {}
  } = input || {};

  const findings = [];
  let status = 'pass';

  // Basic envelope checks
  const protocolValid = messageEnvelope.protocol && messageEnvelope.protocol.name === 'FEP' && !!messageEnvelope.protocol.version;
  const messageValid = messageEnvelope.message && !!messageEnvelope.message.messageType && !!messageEnvelope.message.messageId;

  if (!protocolValid || !messageValid) {
    findings.push({
      code: 'FEP_MESSAGE_ENVELOPE_VALID',
      severity: 'high',
      status: 'fail',
      message: 'Missing or invalid protocol/message envelope fields'
    });
    return {
      status: 'fail',
      protocolValidity: false,
      compatibility: null,
      governanceEvaluation: null,
      trustEvaluation: null,
      evidenceEvaluation: { valid: false, required: [], found: null },
      stateTransitionEvaluation: null,
      findings,
      telemetry: {}
    };
  }

  const msgType = messageEnvelope.message.messageType;

  // Signature verification
  const sigResult = verifyMessageSignature(messageEnvelope, trustStore);
  if (!sigResult.valid) {
    findings.push({
      code: 'FEP_SIGNATURE_INVALID',
      severity: 'high',
      status: 'fail',
      message: `Signature verification failed: ${sigResult.reason}`
    });
    status = 'fail';
  } else {
    findings.push({
      code: 'FEP_SIGNATURE_VALID',
      severity: 'info',
      status: 'pass',
      message: 'Message signature verified'
    });
  }

  // Replay / idempotency / TTL checks
  const messageId = messageEnvelope.message.messageId;
  const nonce = messageEnvelope.message.nonce || null;
  const timestamp = messageEnvelope.message.timestamp || messageEnvelope.message.generatedAt || null;
  const replay = checkAndStore({ messageId, nonce, timestamp });
  if (!replay.ok) {
    findings.push({
      code: 'FEP_REPLAY_DETECTED',
      severity: 'high',
      status: 'fail',
      message: `Replay or timestamp error: ${replay.reason}`
    });
    status = 'fail';
  } else {
    findings.push({
      code: 'FEP_REPLAY_CHECK_PASSED',
      severity: 'info',
      status: 'pass',
      message: 'Message TTL and idempotency checks passed'
    });
  }

  // Evidence validation (policy or default)
  const policyEvidenceReq = (policy.evidenceRequirements && policy.evidenceRequirements[msgType]) || null;
  const defaultEvidenceMap = {
    'assignment_activated': ['assignment_acceptance_record'],
    'assignment_accepted': ['assignment_acceptance_record'],
    'capability_publication': ['capability_attestation'],
    'governance_assertion': ['governance_approval_record']
  };
  const requiredEvidence = policyEvidenceReq || defaultEvidenceMap[msgType] || [];

  const evidenceBlock = messageEnvelope.evidence || null;
  let evidenceValid = true;
  let evidenceErrors = [];
  let evidenceFoundType = null;

  if (requiredEvidence.length > 0) {
    if (!evidenceBlock) {
      evidenceValid = false;
      evidenceErrors.push('evidence block missing');
    } else {
      const normalized = normalizeEvidenceEnvelope(evidenceBlock);
      const { valid, errors } = validateEvidenceEnvelope(normalized);
      evidenceValid = valid && (requiredEvidence.length === 0 || requiredEvidence.includes(normalized && normalized.evidenceType));
      if (!valid) evidenceErrors = evidenceErrors.concat(errors || []);
      if (normalized && normalized.evidenceType) evidenceFoundType = normalized.evidenceType;
      if (valid && !requiredEvidence.includes(normalized.evidenceType)) {
        evidenceValid = false;
        evidenceErrors.push(`evidenceType "${normalized.evidenceType}" not in required list: ${requiredEvidence.join(',')}`);
      }
    }

    findings.push({
      code: evidenceValid ? 'FEP_EVIDENCE_ATTACHED' : 'FEP_EVIDENCE_MISSING_OR_INVALID',
      severity: evidenceValid ? 'info' : 'high',
      status: evidenceValid ? 'pass' : 'fail',
      message: evidenceValid ? 'Required evidence is present and valid.' : `Evidence required: [${requiredEvidence.join(',')}]`,
      evidence: evidenceFoundType ? [evidenceFoundType] : [],
      errors: evidenceErrors
    });
  } else {
    findings.push({
      code: 'FEP_EVIDENCE_NOT_REQUIRED',
      severity: 'info',
      status: 'pass',
      message: 'No evidence requirements for this message type/profile'
    });
  }

  if (!evidenceValid) status = 'fail';

  // Placeholders for other evaluations
  const compatibility = { status: 'undetermined' };
  const governanceEvaluation = { status: 'undetermined' };
  const trustEvaluation = { status: 'undetermined' };
  const stateTransitionEvaluation = { status: 'undetermined' };

  // Build and persist audit trail
  const auditInput = {
    preflightSummary: null,
    signatureAnalysis: sigResult,
    evidenceValidation: { valid: evidenceValid, errors: evidenceErrors, found: evidenceFoundType, required: requiredEvidence },
    replayCheck: replay,
    findings,
    messageEnvelope,
    policy,
    trustEvaluation,
    governanceEvaluation,
    stateTransitionEvaluation
  };

  const auditTrail = auditTrailBuilder.build(auditInput);
  const savedAudit = auditStore.save({ metadata: { messageId }, auditTrail });

  return {
    status,
    protocolValidity: true,
    compatibility,
    governanceEvaluation,
    trustEvaluation,
    evidenceEvaluation: { valid: evidenceValid, required: requiredEvidence, found: evidenceFoundType, errors: evidenceErrors },
    stateTransitionEvaluation,
    findings,
    telemetry: {},
    auditTrailId: savedAudit.id,
    auditTrail
  };
}

module.exports = {
  validateFepMessage
};
