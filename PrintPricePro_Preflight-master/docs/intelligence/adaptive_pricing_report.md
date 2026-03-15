# Adaptive Pricing Intelligence — Phase R9

## 1. Market Context Awareness
The `pricingIntelligenceEngine` analyzes the "fairness" and "strategy" behind incoming offers.

### Detected Pricing Patterns
| Pattern | Detection Signal | System Stance |
| :--- | :--- | :--- |
| **Dump Pricing** | Price < 40% of Region Average. | **FLAG AS ANOMALOUS** (Quality Risk). |
| **Congestion Premium**| Price > 150% of Average + Slow Response. | **REROUTE** (Supplier Overload). |
| **Strategic Partner** | Consistent pricing within 5% of benchmark. | **UPGRADE TRUST SCORE**. |

## 2. Pricing Assessment Matrix
Offers are tagged with a `PricingAssessment`:
- **COMPETITIVE**: Normal distribution.
- **ELITE**: High price justified by SLA record.
- **VOLATILE**: Inconsistent pricing history for similar specs.
- **ANOMALOUS**: Potentially fraudulent or "mistake" bid.

## 3. Results
*   **Leakage Prevention**: Identifies offers that are too low to sustain industrial quality.
*   **Margin Integrity**: Protects the platform from over-paying for standard commodity jobs during regional peaks.
