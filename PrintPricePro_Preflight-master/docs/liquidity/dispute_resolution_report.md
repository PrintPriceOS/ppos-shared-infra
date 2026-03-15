# Dispute Resolution & Refund Report

## Overview
Industrial production is complex, and deviations (quality issues, delays, damage) are inevitable. The **Dispute Resolution Layer** provides a structured, data-driven framework to handle conflicts without stalling the entire settlement system.

## Dispute Lifecycle
When a Publisher flags a job, the Escrow is immediately moved to `DISPUTED`.

1. **Self-Resolution (24h Window)**: Printer and Publisher can agree on a partial refund (e.g., 20% discount for late delivery).
2. **AI-Arbitration**: If no agreement is reached, PPOS AI analyzes:
   - File Upload (Preflight logs)
   - Delivery Timestamp (Logistics logs)
   - Printer history and SLA performance
3. **Manual Verification**: High-value disputes (> $10k) are escalated to human market operators.

## Data Model: ProductionDispute
```json
{
  "dispute_id": "disp-880-abc",
  "job_id": "job-5501-v2",
  "dispute_reason": "late_delivery",
  "dispute_status": "INVESTIGATING",
  "evidence": {
    "slm_promise": "2026-03-14",
    "actual_delivery": "2026-03-16",
    "gps_logs": "valid"
  },
  "arbitration_decision": null,
  "refund_amount": 0.00,
  "penalty_amount": 0.00
}
```

## Simulated Case Studies
| Issue | System Action | Financial Outcome |
| :--- | :--- | :--- |
| **Late Delivery** | SLA logic confirms 48h delay. | 10% penalty deducted from Printer Payout; Refunded to Publisher. |
| **Quality Failure** | Preflight AI confirms color delta deviation. | 50% refund or Re-print order (new escrow created at printer's cost). |
| **Partial Shipment** | Logistics confirms 80% boxes arrived. | 20% value held in escrow until remainder arrives. |
| **Cancellation** | Publisher cancels post-flight but pre-press. | Setup fee (15%) released to Printer; rest refunded to Publisher. |

## Integration with Governance
- **SLA Risk Score**: Frequent disputes automatically lower a printer's "SLA Risk Score," reducing their visibility in the Marketplace.
- **Escrow Freeze**: In severe cases (suspected fraud), the system can freeze ALL open escrows for a specific printer node.

---
*PrintPrice OS — Production Liquidity Layer Infrastructure*
