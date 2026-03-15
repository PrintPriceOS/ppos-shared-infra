# Carrier Integration Layer Report

## Overview
The **Carrier Integration Layer (CIL)** is the industrial adapter that bridges the PrintPrice OS digital orchestration with physical global logistics providers. It normalizes disparate carrier APIs into a unified canonical model, allowing the system to dispatch shipments across different providers without custom logic for each.

## Supported Carrier Patterns
| Carrier | Type | Regional Strength | API Level |
| :--- | :--- | :--- | :--- |
| **DHL** | Global Express / Freight | Europe, Asia, Global | High (REST/Global) |
| **UPS** | Global Parcel | NA, Europe | High (REST) |
| **FedEx** | Express / Air | NA, Global | High (Cloud) |
| **DPD / GLS** | Regional Ground | UK, EU | Medium (Webhooks) |
| **Local Pallet** | Industrial Freight | Heavy Shipments | Low (Portal/EDI) |

## Canonical Carrier Object
Every integration must map to the `CarrierService` standard:

```json
{
  "carrier_id": "carrier-dhl-global",
  "region": "GLOBAL",
  "service_type": "EXPRESS_PARCEL",
  "delivery_speed": "48H",
  "tracking_capability": "FULL_REALTIME",
  "customs_support": true,
  "cost_model": "DYNAMIC_ZONE_WEIGHT"
}
```

## Functional Workflows
1. **Capability Discovery**: Query which carriers support specific package dimensions and destination zones.
2. **Label Generation**: Automated creation of shipping labels and commercial invoices for customs.
3. **Manifest Creation**: Grouping multiple jobs into single collection events for industrial efficiency.
4. **Handoff Verification**: Digital signature or scan confirming the printer has handed the job to the carrier.

## Normalization Strategy
The CIL uses a **Strategy Pattern** to handle carrier-specific logic (e.g., DHL Commercial Invoices vs UPS Paperless Trade) while exposing a clean `createShipment()` interface to the rest of the OS.

---
*PrintPrice OS — Global Print Logistics Infrastructure*
