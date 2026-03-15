# Drift Detection & Regional Consistency
# PrintPrice OS — Multi-Region Consistency

Regional Drift occurs when the state of a secondary region diverges from the authoritative region due to missed events or unhandled conflicts.

## 1. Detection Mechanism (`DriftInspector`)

The `DriftInspector` generates a **State Fingerprint**—a cumulative SHA256 hash of all locally known entity-version pairs.

### Comparison Flow:
1. Region A generates Digest A.
2. Region B generates Digest B.
3. If `DigestA.fingerprint !== DigestB.fingerprint`, a drift is detected.

## 2. Drift Taxonomy

| Type | Cause | Remediation |
| :--- | :--- | :--- |
| **Silent Miss** | Event delivery failed and retry exhausted. | Trigger `ReplayEngine` on the missed range. |
| **Logic Divergence**| Different software versions applying same event differently. | Align versions and perform Global Rebuild. |
| **Split-Brain** | Multiple nodes claiming authority during partition. | Epoch-based override; highest epoch wins. |

## 3. Automated Recovery

When drift exceeds the configured tolerance (e.g., entity counts differ by >5%), the system can trigger an automated recovery:
1. **Quarantine Suspect State**: Lock mutations for the affected entities.
2. **Replay Inbx**: Scan from last known-good checkpoint.
3. **Snapshot Request**: Request a fresh authoritative snapshot from the Global Authority.
