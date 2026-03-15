# FEP (Federated Exchange Protocol) Specification v1.0.0

## 1. Introduction
The **Federated Exchange Protocol (FEP)** is the deterministic coordination layer for the PrintPrice OS federated network. It provides a common language for independent nodes to interact, ensuring auditability, governance compliance, and trust-aware coordination.

## 2. Protocol Domains
FEP is organized into functional domains:
- **Identity**: Node registration and profile management.
- **Capability**: Publication and discovery of production capabilities.
- **Request**: Format and semantics for production needs.
- **Offer**: Responses to requests, including pricing and confidence.
- **Assignment**: Binding contracts between requester and fulfiller.
- **Execution**: Lifecycle events during production.
- **Trust**: Propagation of reliability scores and assertions.
- **Governance**: Policy enforcement and compliance tracking.
- **Evidence**: Mandatory audit trails for critical actions.

## 3. Message Envelope
Every message in FEP MUST follow the canonical envelope structure.

```json
{
  "protocol": {
    "name": "FEP",
    "version": "1.0.0",
    "profile": "fep_core"
  },
  "message": {
    "messageId": "msg_unique_id",
    "messageType": "type_name",
    "timestamp": "ISO-8601",
    "sourceNodeId": "sender_id",
    "targetNodeId": "receiver_id",
    "correlationId": "correlation_id"
  },
  "payload": {
    "// Domain-specific content"
  },
  "governance": {
    "policyProfile": "profile_id",
    "assertionId": "assert_id"
  },
  "trust": {
    "trustTier": "tier_id",
    "trustScore": 0.0
  },
  "evidence": {
    "envelopeRef": "ev_ref_id"
  },
  "signature": {
    "type": "detached",
    "ref": "sig_ref"
  }
}
```

## 4. Message Types
Canonical types include:
- `capability_publication`
- `production_request_published`
- `production_offer_submitted`
- `assignment_proposed`
- `assignment_accepted`
- `execution_status_event`
- `trust_assertion`
- `protocol_error`

## 5. Security & Integrity
- **Attribution**: Source nodes must identify themselves via `sourceNodeId`.
- **Integrity**: Messages should carry a signature block (placeholder for PKI).
- **Isolation**: Tenant-specific headers are managed by the envelope within the `governance` block.
