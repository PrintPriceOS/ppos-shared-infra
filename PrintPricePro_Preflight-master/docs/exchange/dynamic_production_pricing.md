# Dynamic Production Pricing — Phase R10

## 1. Surge & Yield Mechanics
Production pricing is no longer static. It reacts to the **Network State**.

### Price Drivers
| Driver | Impact | Logic |
| :--- | :--- | :--- |
| **Regional Congestion**| +10-30% | "Surge Pricing" when EU-WEST is at 95% capacity. |
| **Capacity Surplus** | -5-15% | "Spot Discounts" to attract volume to idle regions (e.g., ASIA-SOUTH). |
| **Urgency Multiplier** | +20% | Priority bypass for jobs requiring sub-48h shipping. |
| **Technical Scarcity** | +15% | Premium for rare finishing (e.g., Foil stamping / Leather bound). |

## 2. Market Pricing Signal (Sample)
```json
{
  "type": "PRICE_SIGNAL",
  "region": "US-EAST",
  "pressure_index": 0.88,
  "recommended_floor_adjustment": 1.12,
  "reason": "Predicted seasonal peak in school-book production."
}
```

## 3. Results
- **Dynamic Equilibrium**: The system nudges demand toward under-utilized nodes.
- **Efficient Allocation**: High-value, high-urgency jobs naturally cluster at the most reliable (and premium) nodes.
