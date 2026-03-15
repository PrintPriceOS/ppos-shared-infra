# 🛡️ PrintPrice OS: R13 — Platform Hardening Blueprint

**Target Status:** LEVEL 3 — PRODUCTION CERTIFIED  
**Objective:** Transform PrintPrice OS into a self-deploying, self-protecting, self-observing, and self-healing industrial infrastructure.

---

## 🏗️ The 5 Layers of Hardening

| Layer | Purpose | Key Actions |
| :--- | :--- | :--- |
| **H1 — Secrets Hardening** | Eliminate .env and plain-text credentials | Secret Injection, Docker Secrets, Vault integration |
| **H2 — Resource Lifecycle** | Autonomous disk, process, and memory management | Auto-cleanup, Worker recycling, Disk quotas |
| **H3 — Observability Stack** | Full telemetry and alerting | Prometheus + Grafana + Loki, Metrics export |
| **H4 — Chaos Engineering** | Continuous resilience verification | Fault injection, random worker kills, latency tests |
| **H5 — Deployment Automation** | One-command installation | `ppos install` automation, full environment setup |

---

## 🛠️ H1 — Secrets Hardening
- **Objective**: Move away from `.env` in production.
- **Implementation**:
    - Use `process.env.SECRET_*` for high-sensitivity keys.
    - Implement a `SecretManager` provider in `ppos-shared-infra`.
    - Integration with Docker Secrets (simple) or Hashicorp Vault (industrial).

## 🛠️ H2 — Resource Lifecycle Management
- **Objective**: Prevent disk exhaustion and memory leaks.
- **Implementation**:
    - **Worker Cleanup**: Mandatory `finally { fs.remove() }` in every job.
    - **Janitor Service**: Cron/Repeatable job to purge `/tmp/ppos-preflight` older than 10 mins.
    - **Disk Guard**: Reject uploads/jobs if free disk < 1GB.
    - **Worker Recycling**: Restart workers after X jobs or Y hours.

## 🛠️ H3 — Observability Stack
- **Objective**: High-fidelity monitoring.
- **Metrics to Export**:
    - `queueDepth`, `workerConcurrency`, `jobLatency`, `jobFailures`, `cpuUsage`, `memoryUsage`, `diskUsage`.
- **Critical Alerts**:
    - Queue backlog > 1000.
    - Worker crash rate > 5%.
    - Disk usage > 80%.

## 🛠️ H4 — Chaos & Fault Injection
- **Objective**: Prove the system cannot be killed.
- **Scenarios**:
    - **Kill Workers**: Randomly terminate workers every 4h.
    - **Redis Restart**: Flip the persistence layer under load.
    - **Network Latency**: Inject 2s delay between orchestrator and workers.

## 🛠️ H5 — Master Deployment System
- **Objective**: Single command to rule them all.
- **Command**: `./setup-ppos.ps1` (Hardened) or `ppos install`.
- **Workflow**: Clone -> Deps -> Ghostscript -> Env Inject -> Seeds -> Build -> Start -> Health Check.

---

## 📈 Roadmap to Level 3

1. **R13.1**: Disk Lifecycle (H2) - *In Progress*
2. **R13.2**: Secrets Hardening (H1)
3. **R13.3**: Metrics & Observability (H3)
4. **R13.4**: Chaos Validation (H4)
5. **R13.5**: Deployment Final Polish (H5)
