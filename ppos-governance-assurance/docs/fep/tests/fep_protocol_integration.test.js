// Integration tests: signature + replay + evidence checks
const { validateFepMessage } = require('../services/fepProtocolService');
const { clearStore } = require('../services/messageIdStore');
const auditStore = require('../../../services/auditStore');

beforeEach(() => {
  clearStore();
  auditStore.clear();
});

test('message with valid signature and required evidence passes and audit stored', () => {
  const envelope = {
    protocol: { name: 'FEP', version: '1.0.0' },
    message: { messageId: 'm1', messageType: 'assignment_activated', timestamp: '2026-03-09T06:10:00Z', nonce: 'n1' },
    evidence: {
      evidenceId: 'ev_001',
      evidenceType: 'assignment_acceptance_record',
      generatedAt: '2026-03-09T06:10:00Z',
      actorId: 'publisher_alpha_ops',
      assuranceLevel: 'high',
      traceRefs: ['req_001'],
      artifacts: []
    },
    signature: {
      signatureType: 'detached_assertion',
      signingNodeId: 'publisher_alpha',
      keyId: 'kid_test',
      algorithm: 'ECDSA+SHA256',
      createdAt: '2026-03-09T06:10:00Z',
      signatureValue: 'VALID'
    }
  };

  const trustStore = { kid_test: { /* publicKey stub */ } };

  const res = validateFepMessage({ messageEnvelope: envelope, policy: {}, trustStore });
  expect(res.status).toBe('pass');
  expect(res.auditTrail).toBeTruthy();
  expect(res.auditTrailId).toBe('m1');

  const persisted = auditStore.get('m1');
  expect(persisted).toBeTruthy();
  expect(Array.isArray(persisted.auditTrail) || Array.isArray(persisted.auditTrail) === false).toBe(true);

  const steps = res.auditTrail.map(s => s.step);
  expect(steps).toContain('fep_signature_verification');
  expect(steps).toContain('fep_evidence_validation');
  expect(steps).toContain('fep_replay_check');
  expect(steps).toContain('fep_message_summary');

  const msgSummary = res.auditTrail.find(s => s.step === 'fep_message_summary');
  expect(msgSummary).toBeTruthy();
  expect(msgSummary.evidence.messageId).toBe('m1');
});

test('replay detection blocks repeated messageId+nonce', () => {
  const envelope = {
    protocol: { name: 'FEP', version: '1.0.0' },
    message: { messageId: 'm2', messageType: 'capability_publication', timestamp: new Date().toISOString(), nonce: 'n2' },
    evidence: {
      evidenceId: 'ev_002',
      evidenceType: 'capability_attestation',
      generatedAt: new Date().toISOString(),
      actorId: 'node_x',
      assuranceLevel: 'moderate',
      traceRefs: [],
      artifacts: []
    },
    signature: {
      signatureType: 'detached_assertion',
      signingNodeId: 'node_x',
      keyId: 'kid_test',
      algorithm: 'ECDSA+SHA256',
      createdAt: new Date().toISOString(),
      signatureValue: 'VALID'
    }
  };

  const trustStore = { kid_test: {} };
  const first = validateFepMessage({ messageEnvelope: envelope, trustStore });
  expect(first.status).toBe('pass');

  const second = validateFepMessage({ messageEnvelope: envelope, trustStore });
  expect(second.status).toBe('fail');
  const replayFinding = second.findings.find(f => f.code === 'FEP_REPLAY_DETECTED');
  expect(replayFinding).toBeTruthy();
});
