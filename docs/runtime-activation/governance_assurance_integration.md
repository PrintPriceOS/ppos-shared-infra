# Governance Assurance Integration
# PrintPrice OS — Multi-Region Runtime Activation

The `ppos-governance-assurance` service now acts as the canonical validator for runtime authority and emergency overrides.

## 1. Runtime Authority Service

A new `RuntimeAuthorityService` has been introduced to centralize the logic for evaluating regional permissions.

### 1.1 Core Interfaces

```javascript
const runtimeAuth = require('./src/runtimeAuthorityService');

// 1. Evaluate a specific action
const actionStatus = runtimeAuth.evaluatePolicyAction('printer_onboarding');

// 2. Validate policy mutation authority
const mutationStatus = runtimeAuth.validateAuthorityForPolicyMutation(req);

// 3. Evaluate emergency overrides
const overrideStatus = runtimeAuth.evaluateEmergencyOverride({ action: 'job_intake' });
```

## 2. Decision Logic

The assurance layer integrates directly with the `RuntimePolicyResolver` but adds an additional vetting layer for high-risk operations:

* **Policy Mutation:** Requires `Authority Region` + `Fresh Cache` + `Non-Degraded Mode`.
* **Emergency Overrides:** Evaluates active restrictions even if the region is otherwise healthy.

## 3. Support for Degraded Mode

During regional degradation, the `GovernanceAssurance` layer provides:
* **Staleness Awareness:** Rejects mutations that could cause "split-brain" divergence.
* **Read-Only Enforcements:** Ensures that policies are treated as immutable when sync with the global hub is lost.
* **Local Continuity Vetting:** Validates that local jobs can safely continue executing under the current regional trust profile.

## 4. Emergency Controls

Operators can use the Assurance layer to trigger immediate regional lockdowns:

* `activateEmergencyLockdown(capability)`: Blocks a specific capability (or all) across the local region.
* `clearEmergencyLockdown()`: Restores normal governance behavior.

All emergency state changes are logged with full operator context in the `governance_audit` system.
