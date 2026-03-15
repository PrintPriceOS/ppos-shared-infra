# Deployment Boundary Map

## 1. Production Runtime Units

| Runtime Unit | Target Host / URL | Repository Source |
| :--- | :--- | :--- |
| **Product App** | `preflight.printprice.pro` | `preflight-app` |
| **Control Plane** | `control.printprice.pro` | `ppos-control-plane` |
| **Core Platform** | `api.os.printprice.pro` | `ppos-core-platform` |
| **Preflight Worker** | (Internal Queue Consumer) | `ppos-preflight-worker` |
| **Printer Agent** | (External Hardware Nodes) | `ppos-printer-agent` |
| **Governance Monitor**| (Internal Loop) | `ppos-governance-assurance` |

## 2. Ingress & Routing
- **Public Ingress**: Only `preflight-app` and `ppos-control-plane` (operator) are public.
- **Service Mesh**: internal communication between services and workers happens over a private network/mesh or secure internal API.
- **Worker Isolation**: Workers do not expose public endpoints. They consume from Redis/Temporal.
