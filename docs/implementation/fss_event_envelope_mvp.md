# FSS Event Envelope MVP — PrintPrice OS

## 1. Overview
Defines the canonical structure for all Federated State Synchronization events.

## 2. Structure
```json
{
  "fss_version": "1.0",
  "event_id": "UUID",
  "event_name": "String",
  "origin_region": "EU-PPOS-1",
  "entity_type": "String",
  "entity_id": "String",
  "event_timestamp": "ISO-8601",
  "classification": "GLOBAL|REGIONAL|DERIVED",
  "payload": { ... },
  "signature": "To be implemented in Phase 2"
}
```

## 3. Benefits
- **Deterministic Audit**: Every event has a clear origin and timestamp.
- **Classification Aware**: Consumers know immediately if the event is a global policy or regional telemetry.
- **Future Ready**: Includes placeholders for cryptographic signing and causality tracking.
