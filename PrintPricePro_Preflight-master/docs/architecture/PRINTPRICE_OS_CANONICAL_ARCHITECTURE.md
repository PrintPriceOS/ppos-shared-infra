# PrintPrice OS --- Canonical Architecture

### Autonomous Production Network for Global Print Infrastructure

Version: 1.0 Canonical\
Status: Authoritative Architecture Document

------------------------------------------------------------------------

# 1. Executive Summary

PrintPrice OS is a **distributed production operating system** designed
to orchestrate the global printing infrastructure.

The system separates clearly between:

-   **Product Surface** (user-facing applications)
-   **Platform Runtime** (the operating system)
-   **Federated Production Network** (external printers)
-   **Control Plane** (operator governance)

The architecture enforces strict **repository boundaries** and **runtime
specialization** to prevent monolithic drift and ensure long-term
scalability.

The platform supports:

-   deterministic preflight inspection
-   distributed job orchestration
-   federated printer matchmaking
-   autonomous redispatch
-   governance and economic policy enforcement
-   global production traceability

------------------------------------------------------------------------

# 2. Architectural Principles

## 2.1 Product / Platform Separation

The **Product App is not the platform**.

The product layer exists only to:

-   serve users
-   submit jobs
-   display results

All orchestration belongs to the OS.

------------------------------------------------------------------------

## 2.2 Runtime Specialization

Workers are separated into specialized runtime pools:

  Pool            Responsibility
  --------------- ------------------------
  Heavy Compute   Preflight / AI / PDF
  Transactional   Platform orchestration
  External I/O    APIs / webhooks
  Governance      SLO / reconciliation

------------------------------------------------------------------------

## 2.3 Federation-First Infrastructure

Printers are not internal services.

They are **external production nodes** connected through a secure
federated protocol.

The OS must:

-   discover capability
-   match jobs
-   dispatch offers
-   monitor production state
-   redispatch if necessary

------------------------------------------------------------------------

## 2.4 Governance as a First-Class Layer

Governance is enforced through:

-   policy engines
-   SLO monitors
-   resource guardrails
-   economic controls
-   autonomous resilience loops

------------------------------------------------------------------------

## 2.5 Immutable Event Traceability

All critical actions generate immutable audit trails ensuring:

-   forensic traceability
-   compliance readiness
-   production analytics

------------------------------------------------------------------------

# 3. Repository Topology

PrintPrice OS is composed of multiple independent repositories:

    PrintPriceOS/
    │
    ├ preflight-app
    ├ printprice-os-bootstrap
    ├ ppos-core-platform
    ├ ppos-governance-assurance
    ├ ppos-shared-infra
    ├ ppos-shared-contracts
    ├ ppos-preflight-service
    ├ ppos-preflight-worker
    ├ ppos-preflight-engine
    ├ ppos-build-orchestrator
    └ ppos-printer-agent

Each repository:

-   owns a runtime responsibility
-   deploys independently
-   maintains its own git history

------------------------------------------------------------------------

# 4. Repository Responsibilities

## preflight-app

User-facing product application.

Responsibilities:

-   UI / UX
-   upload flows
-   user authentication
-   job submission
-   job results visualization

Forbidden:

-   worker runtime
-   governance loops
-   federation orchestration
-   printer connectivity logic

------------------------------------------------------------------------

## ppos-core-platform

Platform brain.

Responsibilities:

-   job registry
-   economics policy engine
-   matchmaking
-   dispatch orchestration
-   resource scheduling

------------------------------------------------------------------------

## ppos-governance-assurance

Governance layer.

Responsibilities:

-   SLO monitoring
-   policy validation
-   resilience loops
-   rollback guardrails
-   system safety

------------------------------------------------------------------------

## ppos-preflight-service

HTTP service exposing preflight capabilities.

Responsibilities:

-   request validation
-   orchestration of workers
-   external API ingress

------------------------------------------------------------------------

## ppos-preflight-worker

Asynchronous execution layer.

Responsibilities:

-   background job execution
-   heavy compute orchestration
-   subprocess lifecycle management

------------------------------------------------------------------------

## ppos-preflight-engine

Deterministic PDF inspection engine.

Responsibilities:

-   PDF technical inspection
-   print safety checks
-   specification extraction

------------------------------------------------------------------------

## ppos-shared-contracts

Source of truth for system interfaces.

Contains:

-   DTOs
-   JSON schemas
-   TypeScript interfaces
-   event contracts

------------------------------------------------------------------------

## ppos-shared-infra

Shared infrastructure utilities.

Contains:

-   Redis utilities
-   MySQL utilities
-   resilience primitives
-   infrastructure helpers

------------------------------------------------------------------------

## ppos-build-orchestrator

CI/CD automation layer.

Responsibilities:

-   repository builds
-   promotion pipelines
-   release automation

------------------------------------------------------------------------

## ppos-printer-agent

External printer connector.

Responsibilities:

-   heartbeat
-   job polling
-   job acceptance
-   package download
-   production status reporting

------------------------------------------------------------------------

## printprice-os-bootstrap

Local workspace bootstrap.

Responsibilities:

-   multi-repo initialization
-   development orchestration
-   environment seeding

------------------------------------------------------------------------

# 5. Deployment Model

## Product

Runs at:

    preflight.printprice.pro

Contains only:

-   preflight-app

------------------------------------------------------------------------

## Control Plane

Runs at:

    control.printprice.pro

Provides:

-   federation cockpit
-   governance dashboards
-   network monitoring

------------------------------------------------------------------------

## Platform Services

Deploy independently:

-   core platform
-   workers
-   services
-   governance loops

------------------------------------------------------------------------

# 6. Canonical Boundary Rule

If a module:

-   orchestrates production
-   dispatches jobs
-   governs resources
-   executes workers
-   communicates with printers
-   or serves operators

**it does not belong in the Product App.**

------------------------------------------------------------------------

# 7. Architecture Health Criteria

The system architecture is considered healthy when:

-   Product App repository remains clean
-   platform orchestration lives in core-platform
-   execution lives in workers
-   governance lives in governance-assurance
-   printer agents remain external
-   federation logic remains centralized

------------------------------------------------------------------------

# 8. Final Statement

PrintPrice OS is not a web application.

It is a **production operating system for global printing
infrastructure**.

The Product App is simply one of its clients.
