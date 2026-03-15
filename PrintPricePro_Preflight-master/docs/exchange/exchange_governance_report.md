# Exchange Governance Report — Phase R10

## 1. Market Integrity Controls
The Global Exchange implements **Anti-Manipulation & Fair Trade** guardrails.

### Monitored Anomalies
- **Bid Spamming**: A node submitting 1000s of lowball offers to "block" the market and later withdrawing them.
- **Coordinated Pricing**: Multiple nodes in the same region consistently submitting identical premium adjustments.
- **Capacity Falsification**: Claiming availability that doesn't exist to "capture" future routing.

## 2. Governance Actions
| Signal | System Response | Consequence |
| :--- | :--- | :--- |
| **High Withdrawal Rate** | Trust Downgrade. | Node loses placement score in future matching. |
| **Price Anomaly** | Manual Review Trigger. | Verification of regional price benchmarks. |
| **Capability Lying** | Temporary Suspension. | Isolation from the Exchange for 48 hours. |

## 3. Transparency
- **Decision Clarity**: Every job assignment includes a `MarketFactorCode` (e.g., `MKT-BAL-EU`) explaining why that node was selected over others.
- **Audit Logging**: Full traceability of how price signals were derived from supply/demand data.
