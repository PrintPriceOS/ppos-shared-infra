# Phase 20 — Multi-Tenant Resource Governance

**Objective:** Transition from binary policy blocking to sophisticated resource allocation and capacity management.

## 1. Governance Hierarchy
1. **Legal/Security Gate (Phase 19)**: Can this tenant execute this service? (Allow/Deny)
2. **Economic/Capacity Gate (Phase 20)**: Does this tenant have the remaining budget and concurrency slot? (Throttle/Delay/Deny)

## 2. Resource Dimensions
- **Concurrency**: Active jobs running in parallel.
- **Throughput**: Jobs per minute/hour.
- **Backlog**: Queue depth allowance per tenant.
- **AI Economy**: Token and cost budgets (Real-time).
- **Priority**: Weighted scheduling (Critical > High > Normal > Low).

## 3. Decision Matrix
| Result | Action | Use Case |
| :--- | :--- | :--- |
| **Allow** | Execute immediately | Under quota, healthy system. |
| **Throttle** | Reduce speed | Near rate limits, protecting workers. |
| **Delay** | Re-queue for later | Over quota but non-critical, fair wait. |
| **Degrade** | Exec with reduced cost | Low on AI budget, switch to cheaper model. |
| **Deny** | Reject request | Hard limit exceeded, noisy neighbor protection. |

## 4. Implementation Status
- **20.A**: Data Model & Effective Limit Resolution. [COMPLETED]
- **20.B**: Redis Runtime Counters (The "Hot" State). [COMPLETED]
- **20.C**: Enqueue & Worker Integration. [COMPLETED]
- **20.D**: Weighted Fair Scheduler. [COMPLETED]
- **20.E**: AI Budget Fallback & Cost Guardrails. [COMPLETED]
- **20.F**: Governance Control Plane UI. [COMPLETED]

## 5. Architectural Detail: Phase 20.D — Fair Scheduler
The scheduler uses a weighted ranker to decide the next job for dispatch.
- **Score**: `PriorityClass (1000) + Weight (100) + AgingBonus (200) - SaturationPenalty (200)`.
- **Aging**: Prevents starvation by rewarding jobs that wait longer.
- **Orchestrator**: A background loop re-ranks BullMQ priorities every 10 seconds.

## 6. Architectural Detail: Phase 20.E — AI Budget
Economic governance over high-cost LLM resources.
- **Windows**: Minute, Hour, Day.
- **Cycle**: Reserve (Estimate) -> Execute -> Reconcile (Actual).
- **Fallback**: Automatically downgrades model tiers (Premium -> Standard -> Economy) under budget pressure instead of hard denial.
