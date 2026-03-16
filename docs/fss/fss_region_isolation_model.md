# FSS Region Isolation Model — PrintPrice OS

## 1. Compliance Mandate
The FSS must enforce physical and logical boundaries to ensure that **unauthorized industrial assets** (PDFs, source files, proprietary models) never leave their region of origin.

## 2. Hard Isolation Boundaries

### 2.1 Storage Isolation
- **Bucket Isolation**: S3 buckets are regional. No cross-region IAM policies allowed for data transfer.
- **Worker Isolation**: PPOS Workers in `US-PPOS-1` cannot resolve DNS/IP for data nodes in `EU-PPOS-1`.

### 2.2 Sync Redaction Pattern
The `FSS-Region-Adapter` implements a **Strict Blocklist** for all synchronization payloads:

| Field Pattern | Action | Reason |
| :--- | :--- | :--- |
| `*.pdf`, `*.job` | **STRIP** | Customer Asset |
| `*_path` (absolute) | **STRIP** | Environment Disclosure |
| `customer_*` | **STRIP** | PII Protection |
| `logs` | **REDYCT** | Summary Only (Error codes only) |

## 3. Metadata-Only Replication (MOR)
For jobs that require global visibility (tracking), the FSS replicaton is limited to:
- `job_id` (Universally Unique)
- `status` (queued, processing, completed)
- `region_id` (current location)
- `governance_hash` (SLA proof)

## 4. Forced Data Residency
If a tenant is marked with `residency_requirement: EU`, the FSS coordinator will:
1. Reject any `RegionMove` event for that tenant.
2. Alert the Global Control Plane if a foreign worker attempts to claim a job ID belonging to that tenant.

## 5. Security Guardrails: Isolation Audit
Every 24 hours, the `Governance-Assurance` service scans the `FSS-Event-Log` to ensure no payload size exceeded the metadata threshold (64KB). Any violations trigger an immediate region partition (quarantine).
