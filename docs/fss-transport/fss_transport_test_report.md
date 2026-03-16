# FSS Transport Test Report — PrintPrice OS

## 1. Test Environment
- **Simulation Harness**: `fss_transport_simulation.js`.
- **Crypto Engine**: Node.js `crypto` (Ed25519).
- **Storage**: Local `.runtime/` mock directories.

## 2. Test Execution Log

| Test Case | Description | Result | Evidence |
| :--- | :--- | :---: | :--- |
| **TC-01** | Signed Multi-Region Push | ✅ PASS | US region verified and accepted EU signed policy. |
| **TC-02** | Signature Tamper Protection | ✅ PASS | Forged signature detected and event quarantined. |
| **TC-03** | Idempotent Replay | ✅ PASS | ReplayEngine applied state from inbox without duplication. |
| **TC-04** | Outbox Checkpointing | ✅ PASS | Local outbox scanning respects last processed line. |
| **TC-05** | Authority Validation | ✅ PASS | US region rejected unauthorized policy update from mock peer. |

## 3. Key Findings
- **Ed25519 Performance**: Signature verification is sub-millisecond, allowing for high-throughput reception.
- **Deduplication Effectiveness**: The `dedupe_index` correctly blocked duplicate events during the replay simulation.
- **Fail-Safe Convergence**: The authority-based applier ensures that regions only accept state from trusted sources for specific entity types.

## 4. Verdict
**PrintPrice OS — FSS Transport Layer READY**
**Signed Multi-Region Control-State Replication Implemented.**
