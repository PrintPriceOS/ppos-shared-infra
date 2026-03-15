# Distributed Offer Market Report — PrintPrice OS

## 1. Offer Lifecycle
The network operates a **Pull-Based Offer Market**.

1. **Emit**: Platform identifies candidates and creates `OFFERED` dispatches.
2. **Poll**: Printer Agents query `/available` for eligible jobs.
3. **Accept**: Node commits to the job, triggering an atomic state transition in `federated_dispatches`.
4. **Expire**: Stale offers (typical TTL: 300s) are automatically re-queued for the next best candidate.

## 2. Competitive Selection
Offers are ranked by the **Match Score** (max 1000 pts).

| Score Component | Weight | Focus |
| :--- | :---: | :--- |
| **Availability**| 300 | Instant readiness vs Queue depth. |
| **Reliability** | 250 | Historical acceptance rate. |
| **SLA Tier** | 200 | Contractual commitment level. |
| **Trust Score** | 150 | Governance vetting status. |
| **Proximity** | 100 | Geographical distance optimization. |

## 3. Market Behavior
*   **Winner Selection**: The system currently defaults to the highest score candidate for automatic routing.
*   **Contention**: Database locking ensures an offer is only accepted by ONE node.
