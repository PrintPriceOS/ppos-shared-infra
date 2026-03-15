# Network Routing Report — PrintPrice OS

## 1. Optimal Routing Logic
The Routing Engine (`federatedMatchmakerService`) resolves the optimal production node by multi-dimensional optimization.

| Optimization Vector | Methodology |
| :--- | :--- |
| **Geographic** | Region-based filtering (e.g., Serve EU customers from EU nodes). |
| **Industrial** | Machine-to-Job compatibility (e.g., High-volume books to Offset). |
| **Operational** | Load balancing based on real-time `queue_depth`. |

## 2. Redispatch & Failover
- **Manual Override**: Control Plane operators can force-redispatch stuck jobs.
- **Auto-Failover**: If a node fails to download a job package within the threshold, the system triggers `RedispatchService` to move the job to the #2 ranked candidate.

## 3. Findings
*   **Decentralization**: The Routing Engine is centralized in the Control Plane but operates on decentralized supply data from the Printer Agents.
*   **Routing Efficiency**: Cross-region routing is supported but penalized by the `proximity` score component to favor local production.
