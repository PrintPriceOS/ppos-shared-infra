# Capacity Liquidity Report — Phase R10

**Status**: ACTIVE
**Concept**: Production as a Tradable Commodity.

## 1. Capacity Tokenization
The exchange treats **Machine Hours** and **Binding Slots** as liquid assets. 

### Capacity Model (The "Industrial Slot")
| Resource | Unit | Tradability | Description |
| :--- | :--- | :--- | :--- |
| **Press Time** | Minute | High | Direct availability for CMYK/Spot production. |
| **Binding Slot** | Slot | Medium | Pre-allocated finishing time for specific job types. |
| **Storage/Wait** | Hour | Low | Buffering capacity for staging materials. |

## 2. Real-Time Inventory Tracking
Nodes publish their availability via the `CapacityRegistry`. 
- **Spot Capacity**: Immediate openings due to cancellations or early completions.
- **Reserved Capacity**: Pre-sold slots for high-priority production contracts.
- **Future Liquidity**: Predicted availability for the next 7-14 days.

## 3. Findings
*   Transforming idle time into "Spot Offers" increases node utilization by an estimated 18%.
*   The system can now distinguish between **"Soft Capacity"** (flexible scheduling) and **"Hard Capacity"** (fixed technical windows).
