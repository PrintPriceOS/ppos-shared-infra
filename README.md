# PrintPrice OS

**The Industrial Operating System for Federated Print Networks.**

PrintPrice OS (PPOS) is a high-performance, resilient, and secure ecosystem designed to manage distributed print production at scale. It implements the Federated Print Protocol (FPP) and provides a unified intelligence layer for job preflight, routing, and governance.

## 🚀 Quick Start

To bootstrap the entire ecosystem on a fresh machine:

### Windows (PowerShell)
```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

### Linux / macOS (Bash)
```bash
chmod +x setup.sh
./setup.sh
```

## 🏗️ Architecture

PPOS follows a modular, decouped architecture across the following layers:

- **Core Platform**: Identity, Org Management, and Global State.
- **Preflight Engine**: High-speed PDF analysis and remediation.
- **Control Plane**: Operational cockpit and monitoring.
- **Shared Infra**: Reusable services for data, comms, and resilience.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for more details.

## 📂 Repository Structure

- `ppos-preflight-engine/`: Core logic for print-ready validation.
- `ppos-preflight-service/`: HTTP/GRPC API wrappers.
- `ppos-preflight-worker/`: Job-based distributed execution.
- `ppos-shared-infra/`: Common libraries and resilience patterns.
- `docs/`: Comprehensive technical documentation.

## 🛡️ Security

Security is baked into the R13 hardening layer.
- **Secret Management**: Unified via `SecretManager`.
- **Policy Enforcement**: Industrial-grade governance gates.
- **Audit**: Immutable logging for all critical operations.

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.


## 🏆 Milestones
- **[v1.4.0] Multi-Region Runtime Activation**: Authority-aware execution gates, staleness-aware federation, and regional failover coordination.

## 📝 License

Distributed under the PrintPrice Industrial License. See [LICENSE](./LICENSE) for details.
