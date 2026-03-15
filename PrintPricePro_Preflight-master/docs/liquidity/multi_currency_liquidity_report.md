# Multi-Currency Liquidity Report

## Overview
The Global Print Exchange operates across 7 core industrial regions. To ensure price stability and printer reliability, the **Multi-Currency Liquidity Layer** manages real-time FX (Foreign Exchange) conversion and rate-locking.

## Supported Currencies
| Currency | Region | Role |
| :--- | :--- | :--- |
| **USD** | North America | Global Settlement Standard |
| **EUR** | European Union | Primary Industrial Hub |
| **GBP** | United Kingdom | High-end Publication Market |
| **CNY** | China | High-volume Manufacturing |
| **JPY** | Japan | Precision Print Market |
| **CAD** | Canada | North American Logistics Hub |
| **AUD** | Australia | Oceanic Distribution |

## The Rate-Lock Mechanism
To protect Printers from currency volatility during long production cycles (e.g., a 15-day book run), PPOS implements a **Quote-Time Rate Lock**.

1. **Offer Stage**: Printer quotes in their local currency (e.g., CNY).
2. **Acceptance Stage**: System converts to Publisher's currency (e.g., EUR) using current FX + 0.5% buffer.
3. **Escrow Funding**: Rate is locked for 30 days. PPOS absorbs or gains from minor fluctuations.

## Data Model: CurrencySettlement
```json
{
  "job_id": "job-887-fx",
  "source_currency": "EUR",
  "settlement_currency": "CNY",
  "fx_rate": 7.82,
  "converted_amount": 97750.00,
  "fx_fee": 48.00,
  "locking_id": "lock-99221"
}
```

## Liquidity Safeguards
- **Stable Payout Guarantee**: Printers always receive the exact amount of their local currency quoted at the time of job assignment.
- **Translucency layer**: Publishers see the FX fee transparently broken down, preventing hidden costs.
- **FX Hedging**: For large jobs (>100k USD), the system automatically uses a hedging provider to lock in delivery rates.

## Regional Routing Case Study: SEPA vs SWIFT
- **EUR-EUR**: Settled via SEPA Instant (Next-Gen low-fee).
- **EUR-USD**: Settled via Wise/Stripe cross-border liquidity pools.
- **CNY Settlements**: Utilizes specialized industrial payment rails to ensure compliance with local CAPITAL controls.

---
*PrintPrice OS — Production Liquidity Layer Infrastructure*
