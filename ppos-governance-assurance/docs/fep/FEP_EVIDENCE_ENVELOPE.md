# FEP Evidence Envelope

## 1. Purpose
The **Evidence Envelope** is the mandatory audit rastro for all high-impact state transitions in the FEP. It ensures that every claim (e.g., "I accept this assignment") is backed by metadata that can be verified during audits or disputes.

## 2. Evidence Types
- `capability_attestation`: Proof of certified equipment or certifications.
- `request_publication_record`: Log entry for the creation of a need.
- `offer_submission_record`: Evidence of price and terms commitment.
- `assignment_acceptance_record`: Legal/Operational binding event.
- `governance_approval_record`: Policy checker pass log.

## 3. Structure
```json
{
  "evidenceId": "ev_uuid",
  "evidenceType": "assignment_acceptance_record",
  "generatedAt": "ISO-8601",
  "actorId": "node_uuid",
  "assuranceLevel": "high",
  "traceRefs": ["req_001", "offer_001"],
  "artifacts": [
    {
      "artifactType": "digital_signature",
      "artifactRef": "sig_ref_001"
    }
  ],
  "checksum": "sha256_hash"
}
```

## 4. Operational rules
- Transitions to `active` (Assignment) MUST fail if `evidence.envelopeRef` is missing.
- Verification of the envelope is performed by `fepEvidenceEnvelopeService`.
- Checksums SHOULD cover the `payload` of the original message to prevent tampering.
