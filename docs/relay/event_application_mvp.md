# Event Application (MVP)
# PrintPrice OS — Federated Transport

The Event Applier is responsible for executing the side-effects of accepted federated events. For the MVP, it focuses on three critical event types that maintain the distributed state of the network.

## 1. Supported Events

### 1.1 `PolicyPublished`
* **Effect**: Updates the local regional policy cache and triggers a cache invalidation.
* **Authority**: Must originate from the Global Authority region.
* **Idempotency**: If the policy version is older than or equal to the current, the update is skipped.

### 1.2 `PrinterNodeRegistered`
* **Effect**: Adds or updates a printer in the regional `PrinterRegistry`.
* **Effect**: Seeds HMAC credentials or technical capabilities for the printer.
* **Idempotency**: Atomic UPSERT into the `printer_nodes` table.

### 1.3 `RegionHealthSummaryPublished`
* **Effect**: Updates the regional view of other regions' health (Heartbeats).
* **Effect**: Used by the `FederationCockpit` to display a global network status.

## 2. Integrity and Atomicity

* **Authority Check**: Every application cycle re-verifies the sender's authority via `FederatedAuthorizationService`.
* **Audit**: Every successful application is logged in the `governance_audit` with the `fss_event_id` as the source.
* **Fail-Closed**: If an application fails (e.g., database error), the event status remains `PENDING` in the inbox to be retried by the `ReplayEngine`.

## 3. Implementation Workflow

1. Inbox Event is picked up by `ReplayEngine`.
2. `EventApplicationMVP` determines the handler based on `event_name`.
3. Handler executes local data mutations (SQL/Redis).
4. Logic triggers any necessary in-memory invalidations (e.g., `policyEnforcementService.invalidateCache()`).
