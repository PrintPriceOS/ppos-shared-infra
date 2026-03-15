# Architecture — PrintPrice OS

## Design Philosophy

PrintPrice OS is built on the principles of **determinism, isolation, and resilience**.

### 1. Unified Intelligence Layer
The system uses a federated intelligence layer to make decisions about job routing and price estimation without centralized bottlenecks.

### 2. Service Separation (R1–R12)
The roadmap R1-R12 ensures that the preflight engine, service wrappers, and background workers are fully decoupled.
- **Engine**: Pure logic, no network assumptions.
- **Service**: Stateless API layer.
- **Worker**: Stateful job consumer.

### 3. Resilience Hardening (R13)
The R13 layer introduces:
- **Circuit Breakers**: Protecting against cascading failures.
- **Adaptive Heartbeats**: Dynamic lease management for long-running jobs.
- **Capacity Gates**: Industrial-grade concurrency control.

## Component Overview

- **ppos-preflight-engine**: Leverages Ghostscript and custom heuristics for PDF analysis.
- **ppos-shared-infra**: Provides a "Service Mesh Lite" for inner-organization communication.
- **ppos-governance-assurance**: Enforces organizational policies and SLAs.

## Data Flow
1. **Ingress**: Job enqueued via Preflight Service.
2. **Orchestration**: Worker picks up job based on Pool assignment.
3. **Execution**: Engine runs in an isolated subprocess.
4. **Governance**: Policy Engine validates results against SLA.
5. **Egress**: Results emitted to Federated Registry.
