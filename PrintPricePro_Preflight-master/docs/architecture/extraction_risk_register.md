# Extraction Risk Register

| Risk | Impact | Mitigation Strategy | Status |
| :--- | :--- | :--- | :--- |
| **Broken Imports** | HIGH | Use aliasing and compatibility bridges (index.js shims). | Planned |
| **Lost Data Persistence** | CRITICAL | Shared DB access remains via `ppos-shared-infra` during transition. | Low Risk |
| **Federation Disconnect** | MEDIUM | Ensure `ppos-printer-agent` is updated to point to standalone Core. | Active |
| **CI/CD Failure** | MEDIUM | Parallel deployment test before switching primary repo. | Planned |
| **Environment Mismatch** | LOW | Use `bootstrap-repos.ps1` to sync local environments. | Low Risk |
| **Auth Boundary Leak** | HIGH | Strict RBAC in Control Plane separate from Product Auth. | Active |
