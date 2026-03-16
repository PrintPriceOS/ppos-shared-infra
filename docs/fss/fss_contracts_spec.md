# FSS Canonical Data Contracts — PrintPrice OS

## 1. Base Event Schema
All FSS messages must follow this header format to ensure auditability and replay safety.

```json
{
  "fss_version": "1.0",
  "event_id": "uuid-v4",
  "event_type": "string",
  "origin": {
    "region_id": "string",
    "node_id": "string"
  },
  "sequence_id": "uint64",
  "timestamp": "iso-8601",
  "entitity": {
    "type": "string",
    "id": "string"
  },
  "payload": "object",
  "signature": "base64-ed25519"
}
```

## 2. Core Event Definitions

### 2.1 OrgStateUpdated
Fired when a global organization changes trust status or metadata.
- **Classification**: `GLOBAL`
- **Payload**: `{ "tenant_id": "id", "status": "active|suspended", "metadata": { ... } }`

### 2.2 PolicyPublished
Used to propagate R13 governance rules.
- **Classification**: `GLOBAL`
- **Payload**: `{ "policy_id": "id", "hash": "sha256", "rules": [ ... ], "enforce_at": "timestamp" }`

### 2.3 PrinterNodeRegistered
Announces regional capability to the global network.
- **Classification**: `GLOBAL` (Metadata only)
- **Payload**: `{ "node_id": "id", "capabilities": [ "3d-print", "packaging" ], "geo": { "lat": 0, "lon": 0 } }`

### 2.4 RegionHealthSummaryPublished
Dynamic telemetry for global routing.
- **Classification**: `EPHEMERAL`
- **Payload**: `{ "load_score": 0.85, "active_workers": 24, "latency_ms": 120 }`

## 3. Implementation Constraints
- **Payload Size**: Restricted to < 64KB (strictly metadata).
- **Versioning**: Consumers must support N-1 minor versions.
- **Redaction**: Fields ending in `_local` or `_secret` are auto-stripped by the RSA.
