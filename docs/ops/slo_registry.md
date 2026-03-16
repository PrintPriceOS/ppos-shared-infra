# SLO Registry — PrintPrice OS

This document serves as the formal definition of Service Level Objectives (SLOs) and Error Budgets for the PrintPrice OS platform.

## 1. Core Platform SLOs (Ingestion & Dispatch)

| Name | Formula | Target | Window | Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| **Enqueue Latency** | `p95(API.enqueue_time)` | < 200ms | 1 hour | Scale API instances / Throttling |
| **Enqueue Success** | `success_count / total_requests` | > 99.5%| 24 hours | Check Governance rejection rate |
| **Time-to-Start** | `p95(Job.start_time - Job.enqueue_time)` | < 30s | 1 hour | Increase Pool A/B workers |

## 2. Runtime Reliability SLOs (Execution)

| Name | Formula | Target | Window | Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| **Job Success Rate** | `job_succeeded / total_jobs` | > 99.0%| 24 hours | Investigate Repo/PDF patogens |
| **Lease Integrity** | `late_heartbeat_count / total_heartbeats`| < 0.1% | 1 hour | Reduce worker CPU saturation |
| **Breaker Uptime** | `time_closed / total_time` | > 99% | 1 week | Review external dependency SLAs |

## 3. Economic & Governance SLOs

| Name | Formula | Target | Window | Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| **AI Cost Variance** | `abs(actual - estimated) / estimated`| < 15% | 24 hours | Retrain/Adjust AI estimators |
| **Fairness Skew** | `max_wait / min_wait` (of same class) | < 2.5x | 1 hour | Increase aging bonus factor |
| **Budget Safety** | `overage_events` | 0 | 1 month | Forced Tier Fallback |

---

## 4. Operational States

| State | Definition | Impact |
| :--- | :--- | :--- |
| **HEALTHY** | All SLOs >= Target | Normal operation. |
| **DEGRADED** | 1+ SLO within 10% of Target | Warning in Control Plane. |
| **AT_RISK** | Error Budget burn > 50% | Freeze non-critical maintenance. |
| **BREACH** | SLO < Target | Automated Mitigations (Throttling/Fallbacks). |

---

## 5. Automatic Mitigations Catalogue

### M1: Pool A Throttling
- **Trigger**: `Time-to-Start` > 60s OR `Lease Integrity` < 99%.
- **Action**: Dynamically reduce `POOL_A_CONCURRENCY` by 50% via Governance Manager.

### M2: AI Economy Fallback
- **Trigger**: `AI Cost Variance` > 20% OR `Budget Safety` failure.
- **Action**: Force all sub-Enterprise tenants to `economy` model tier hint.

### M3: Aggressive Breaker
- **Trigger**: `Breaker Uptime` < 90%.
- **Action**: Reduce error threshold to 2 failures for affected dependencies.

---
*Created as part of Phase 21.D — SLO Monitoring & Enforcement.*
