# Shipment Tracking & Visibility Report

## Overview
Transparency is critical in industrial logistics. The **Shipment Tracking Layer** provides a real-time, normalized stream of events across all carriers and hubs in the Global Print Logistics Network.

## Canonical Tracking Stream
The system consumes raw carrier webhooks and normalizes them into `ShipmentTrackingEvent` objects.

```json
{
  "shipment_id": "shp-8822-v",
  "carrier_id": "UPS",
  "event_type": "IN_TRANSIT",
  "event_timestamp": "2026-03-15T16:00:00Z",
  "location": "Louisville, KY (Worldport)",
  "status": "On Schedule",
  "delay_risk": 0.05
}
```

## Global Tracking States
| State | PPOS Definition |
| :--- | :--- |
| **LABEL_CREATED** | Shipment info sent to carrier; awaiting pickup. |
| **PICKED_UP** | Physical handoff from Printer/Hub confirmed. |
| **IN_TRANSIT** | Moving through carrier network. |
| **CUSTOMS_HELD** | Documentation issue or routine inspection (Alerts `ExceptionManager`). |
| **OUT_FOR_DELIVERY** | Final mile vehicle dispatch. |
| **DELIVERED** | Proof of Delivery (PoD) received (Triggers `SettlementRelease`). |
| **FAILED_ATTEMPT** | Delivery issue (triggers notification to Publisher). |

## Visibility Dashboard
- **Real-time Map**: Geospatial visualization of all active shipments.
- **Aggregated Health**: SLA tracking across carriers (e.g., "DHL is currently averaging 4h delay on UK imports").
- **Proof of Delivery (PoD) Storage**: Permanent archive of digital signatures/photos for arbitration.

---
*PrintPrice OS — Global Print Logistics Infrastructure*
