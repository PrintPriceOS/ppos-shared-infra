# Autonomous Decision Guardrails — Phase R9

## 1. Intelligence vs. Governance
Intelligence **suggests** and **optimizes**, but Governance **limits**.

### Unbreakable Guardrails
| Constraint | Status | Logic |
| :--- | :--- | :--- |
| **Tech Capability**| **HARD** | If a node doesn't have a Binder, Intelligence CANNOT route a book to it. |
| **Trust Threshold** | **HARD** | Nodes with Trust < 20 are excluded regardless of Price/Confidence. |
| **Regional Policy** | **HARD** | Regulatory or policy-driven region locks overrule optimization. |

## 2. Guardrail Breach Simulation
- **Scenario**: Optimizer selects a $5 node with 99% confidence but Trust Score is "Sandbox". **Outcome**: Decision REJECTED by Governance Gate.
- **Scenario**: Risk Engine recommends rejecting a node, but the Operator manually authorizes it. **Outcome**: Override logged as "High Risk - Manual Auth".

## 3. Explainability & Audit
Every autonomous decision is stored with its **Decision Context**:
- Historical snapshots of the scores used.
- Reference to the specific Governance rules that validated the path.

## 4. Conclusion
The Intelligence layer is **Bound by Design**. It operates as a sophisticated advisor within the hard industrial constraints of the PrintPrice OS.
