# Exchange Fee Capture Report

## Overview
The PrintPrice OS Platform sustains itself by capturing a small, programmatically calculated fee from every production job. This fee covers infrastructure costs, liquidity risk management, and market arbitration services.

## Fee Structure
The platform implements a tiered and capability-based fee model.

| Fee Type | Rate | Description |
| :--- | :--- | :--- |
| **Standard Marketplace** | 3.0% | Default fee for standard routing and escrow. |
| **Priority Routing** | +1.5% | Surcharge for urgent jobs using the "Global Priority" lane. |
| **Urgent Delivery** | +0.5% | Applied to jobs with < 48h turnaround time. |
| **Enterprise Governance** | Fixed | Negotiated fixed fee for high-volume enterprise contracts. |

## Data Model: ExchangeFee
```json
{
  "job_id": "job-003-fee",
  "fee_percentage": 3.0,
  "fee_amount": 150.00,
  "fee_currency": "USD",
  "collected_at": "2026-03-15T15:00:00Z",
  "breakdown": {
    "infra_share": 60.00,
    "liquidity_risk_pool": 40.00,
    "profit_margin": 50.00
  }
}
```

## Collection Strategy
- **Automatic Split**: Fee capture occurs at the exact moment of Settlement. The funds are never held by the printer; they are "captured at the source" from the Escrow.
- **Revenue Dashboard**: Real-time visualization of platform revenue, segmented by region and printer type.
- **Tax Inclusion**: Fees are calculated *Exclusive* of VAT/GST, which is handled separately by the regional tax engine.

## Test Scenarios
1. **Scenario A (Standard)**: $5,000 job. 3% fee -> $150 captured.
2. **Scenario B (Priority)**: $2,000 job + 1.5% Priority -> $90 fee (4.5% total).
3. **Scenario C (Urgent Early Delivery)**: Printer delivers 2 days early; bonus applied to printer, but base platform fee remains stable at 3%.

## Revenue Safeguards
- **Negative Settlement Protection**: The system will not allow a job to proceed if the calculated fee creates a sub-marginal payout for the printer, triggering a "Price Floor Alert".

---
*PrintPrice OS — Production Liquidity Layer Infrastructure*
