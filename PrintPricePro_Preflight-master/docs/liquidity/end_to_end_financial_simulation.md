# End-to-End Financial Simulation

## Overview
This simulation traces a high-end industrial publication job through the complete lifecycle of the **Production Liquidity Layer**.

## Job Parameters
- **Job Name**: "Q2 Luxury Catalog Run"
- **Publisher**: Elite Travel Group (EUR Base)
- **Printer**: Precision Print HK (CNY Base)
- **Gross Price**: €50,000.00
- **Priority**: High (Global Priority Lane)

---

## Step 1: Assignment & Funding
- **Currency Conversion**: System locks exchange rate (1 EUR = 7.82 CNY).
- **Escrow Creation**: `ProductionEscrow` object `esc-sim-001` created.
- **Funding**: Publisher pays €50,000.00. Funds locked in Escrow.
- **Status**: `FUNDED`.

## Step 2: Production & Logistics
- **Activation**: Printer sees `FUNDED` status and starts 5,000 unit run.
- **Advance Request**: Printer requests 20% (€10k) for materials. Approved.
- **Logistics**: Job shipped via DHL.
- **Status**: `IN_PRODUCTION` -> `DELIVERED`.

## Step 3: Dispute (Partial)
- **Claim**: Publisher notes 50 copies arrived with binding damage.
- **Arbitration**: AI analyzes photos. Estimates €500.00 value.
- **Agreement**: Printer accepts refund of €500.00.
- **Status**: `DISPUTED` -> `RESOLVED`.

## Step 4: Settlement Execution
- **ASE Calculation**:
  - Original Gross: €50,000.00
  - Refund: (€500.00)
  - Marketplace Fee (3%): (€1,485.00)
  - Priority Surcharge (1.5%): (€742.50)
  - **Net Printer Amount**: **€47,272.50**
- **Existing Advance**: (€10,000.00) already paid.
- **Final Payout**: **€37,272.50**

## Step 5: Payout Dispatch
- **Conversion**: €37,272.50 converted to **291,470.95 CNY** (at locked rate).
- **Execution**: SWIFT transfer to Bank of China.
- **Status**: `RELEASED` -> `PAID`.

---

## Test Scenarios Summary
| Scenario | Outcome |
| :--- | :--- |
| **Normal Path** | 100% success; funds arrive in <48h. |
| **Full Refund** | Escrow returns 100% to publisher minus transaction fees. |
| **FX Spike (+10%)** | Printer payout remains stable at locked rate; Pool absorbs diff. |
| **Delayed Payout** | System triggers "Liquidity Reserve" to pay printer while SWIFT resolves. |

---
*PrintPrice OS — Production Liquidity Layer Infrastructure*
