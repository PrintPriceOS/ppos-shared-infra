# FSS Multi-Region Simulation — PrintPrice OS

## 1. Simulation Scenario: Global Policy Propagation

### Actors
- `EU-PPOS-1`: Global Hub
- `US-PPOS-1`: Secondary Active Region
- `AP-PPOS-1`: Secondary Active Region (Legacy Sync)

### Step 1: Policy Creation
**EU Region** publishes a new security policy: `R13.5 - Mandatory Quota Check`.
- `Event`: `PolicyPublished`
- `Sequence`: `1001`
- `Signature`: `Valid(EU_KEY)`

### Step 2: Propagation
- **US Region** receives the event via `NATS JetStream`.
- **Validation**: Signature verified. `1001` is next in line.
- **Action**: US Governance Engine caches the new policy.

### Step 3: Regional Failure (Partition)
**APAC Region** goes offline due to a lease disruption.
- `EU Hub` detects APAC heartbeat missing.
- `Control Plane` marks APAC as `PARTITIONED`.

### Step 4: Out-of-Sync Activity
While APAC is offline, **EU Region** updates the trust score of `Printer_Node_5` to `0.4` (Suspicious).
- US receives and applies.
- APAC misses the event.

### Step 5: Region Recovery & Replay
**APAC Region** returns online.
- `RSA-APAC` detects its local sequence is `1000` while Global is `1002`.
- **Replay**: APAC pulls events `1001` and `1002`.
- **Converge**: APAC applies policies and trust scores. System is in sync.

## 2. Validation Log

| Step | Aspect | Result | Evidence |
| :--- | :--- | :---: | :--- |
| **S1** | Signature Verification | ✅ | Ed25519 Math Valid |
| **S2** | Metadata Filter | ✅ | No PDF or Customer ID in payload |
| **S3** | Replay Integrity | ✅ | APAC reached sequence `1002` deterministically |
| **S4** | Conflict Bypass | ✅ | EU Authority enforced for policy |

## 3. Final Result
**Simulation Terminated Successfully**. Global consistency achieved without regional data leakage.
