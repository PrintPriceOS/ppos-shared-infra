# Dynamic Offer Scoring Report — Phase R9

## 1. Multi-Dimensional Offer Scoring
Offers are no longer sorted by price alone. The `OfferIntelligenceScore` incorporates real-time operational markers.

### Scoring Components
| Marker | Effect | Description |
| :--- | :---: | :--- |
| **Price Position** | Base | Location within detected market standard for the job. |
| **Fulfillment Confidence**| Bonus/Malus | Predicted probability of on-time delivery. |
| **Congestion Penalty** | Malus | Dynamic reduction based on the printer's current `queue_depth`. |
| **Trust Multiplier** | Bonus | Based on `trust_score` and tenure in the network. |
| **Region Friction** | Malus | Penalty for customs or high-latency shipping routes. |

## 2. Dynamic Evaluation Cases
- **Case: Suspiciously Low Offer**. Node P-01 offers $5 for a $50 job. **System Action**: High Anomaly Score detected. Offer penalized for "Quality Risk".
- **Case: High-Trust Premium**. Node P-Elite offers $60. **System Action**: High "Confidence Bonus" applied. Ranked above cheaper but riskier nodes.

## 3. Results
- **Outcome**: The system prioritizes **Total Fulfillment Utility**.
- **Market Impact**: Reduces "Panic Re-paging" (re-uploading jobs due to failure of low-cost, low-quality bids).
