# Printer Node Federation Report — PrintPrice OS

**Status:** ACTIVE
**Date:** 2026-03-14
**Layer:** Federated Print Network (FPN)

## 1. Node Specification
The platform defines an autonomous production node following the **Autonomous Print Node (APN)** specification.

| Attribute | Type | Description |
| :--- | :--- | :--- |
| **Node ID** | UUID | Unique identifier in the global registry. |
| **Region** | String | Geographical placement for proximity routing (e.g., EU-WEST, US-EAST). |
| **SLA Tier** | Enum | Performance commitment level (Standard, High, Critical). |
| **Trust Level**| Enum | Governance verification status (Verified, Partner, Sandbox). |
| **Capabilities**| Map | Technical technical profile (Formats, Colors, Binding). |

## 2. Federation Mechanisms
- **Self-Onboarding**: Printers register via `printerRegistryService.registerPrinter`.
- **Credentialing**: `printerCredentialService` issues HMAC-SHA256 secrets for secure API negotiation.
- **Heartbeat & Liveness**: Nodes report availability and queue depth every 60s. Inactive nodes (>300s) are automatically isolated from the matchmaking pool.

## 3. Findings
*   The system successfully manages **Node Isolation**. A compromised or unresponsive node can be revoked without affecting the wider network.
*   **Tenant Multitenancy**: Printers can serve multiple upstream product applications via the same Control Plane interface.
