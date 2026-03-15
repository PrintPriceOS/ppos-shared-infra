# Boundary Regression Checklist

Use this checklist to ensure that the Product App boundary remains clean during development.

## 🛡️ Rule 1: No Decision Logic
*   [ ] Does this code decide a production policy? -> **Move to Governance**
*   [ ] Does this code decide a job's routing or matching? -> **Move to Core Platform**
*   [ ] Does this code define a technical preflight rule? -> **Move to Governance**

## 🏗️ Rule 2: No Direct Platform State
- [ ] Direct import from canonical OS repositories? (Mandatory)
- [ ] No local "shim" or "bridge" files created? (PROHIBITED after Phase R5)
- [ ] Logic remains strictly user-facing?
*   [ ] Does this code interact with the `jobs` database for non-UI tasks? -> **Use Platform API**
*   [ ] Does this code manage printer credentials? -> **Move to Core Platform / Control Plane**
*   [ ] Does this code run a background loop/scheduler? -> **Move to Core Platform**

## 🔗 Rule 3: Thin Integration
*   [ ] Is a bridge required? Keep it under 40 lines.
*   [ ] Use `@ppos/shared-contracts` for types and interfaces.
*   [ ] Prefer API calls over local file references to sibling repos.

## 🚀 NEW FEATURE FLOW
If adding a feature:
1. Identify if it's **UX (Product)** or **Logic (OS)**.
2. If OS: Implement in the canonical repo.
3. If Product: Implement in `PrintPricePro_Preflight-master` as a consumer.
