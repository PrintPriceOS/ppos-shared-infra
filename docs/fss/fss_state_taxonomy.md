# FSS State Taxonomy — PrintPrice OS

## 1. State Classification Matrix

| Entity Name | Classification | Source of Truth | Replication Policy | Compliance Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Organizations** | `GLOBAL` | Hub / Genesis Region | Broadcast to All | Shared identities for federation. |
| **Tenants** | `GLOBAL` | Hub | Broadcast to All | Required for cross-region routing. |
| **Trust Scores** | `GLOBAL` | Governance Hub | Eventual Consistency | Derived from regional audits. |
| **Governance Policies** | `GLOBAL` | HQ Region | Strict Broadcast (Signed) | Must be coherent worldwide. |
| **Printer Registry** | `GLOBAL` | Regional Origin | Metadata-only Broadcast | Global awareness of capabilities. |
| **Job Metadata** | `DERIVED` | Regional Origin | Triggered (on-demand) | For tracking only; no PII. |
| **Job Payloads (PDF)**| `REGIONAL` | Regional Origin | **STRICTLY LOCAL** | Residency enforced (GDPR/PIPEDA). |
| **Temporary Files** | `EPHEMERAL` | Local Worker | No Replication | Internal execution state. |
| **Audit Trails** | `REGIONAL` | Local Node | Summary Replicated | Full logs stay root region. |
| **Health Summaries**| `EPHEMERAL` | Regional Monitor | Broadcast to GTM | For geo-routing decisions. |

## 2. Definitions

### GLOBAL
State that must be identical across all regional deployments to ensure organizational coherence.
- *Replication*: All-to-all.
- *Authority*: Centralized (Hub) or signed regional origin.

### REGIONAL
State that contains sensitive industrial data or customer assets.
- *Replication*: **DISABLED** (unless manual failover migration).
- *Boundary*: Physical infrastructure of the region.

### DERIVED
State generated from local events but needed globally for coordination.
- *Replication*: Filtered/Redacted before broadcast.

### EPHEMERAL
Short-lived operational state.
- *Replication*: Local only.

## 3. Compliance Boundaries

- **PII / Customer Data**: Restricted to `REGIONAL`.
- **Market State**: Classified as `GLOBAL` to prevent arbitrage between regions.
- **System Hardening Metadata**: Classified as `GLOBAL` to propagate security patches.
