# SLA & Failure Risk Prediction — Phase R9

## 1. Risk Engine Framework
The `slaRiskEngine` calculates the probability of job failure before the offer is accepted.

### Evaluated Risk Vectors
- **Capacity Risk**: High load relative to node's historically documented speed.
- **Complexity Risk**: Job tech specs (e.g., 5-color printing) vs node's success rate in that category.
- **External Risk**: Regional shipping delays or logistics congestion.
- **Node Health Risk**: Increasing frequency of "Job Received" handshake failures.

## 2. Risk Matrix & Action Guidance

| Risk Level | Prob. of Miss | Recommended Action |
| :--- | :---: | :--- |
| **LOW** | < 2% | Auto-Approve. |
| **MEDIUM** | 2-10% | Approve with "Watch" status; alert Operator if delay +1h. |
| **HIGH** | 10-30% | Require secondary backup offer from a "Partner" node. |
| **CRITICAL** | > 30% | Reject node from the candidate list; trigger re-match. |

## 3. Findings
*   The Risk Engine successfully identifies **"Stealth Overload"** (printers that accept more than they can process).
*   Correctly flags **"Tech Mismatch"** when a node's hardware technically supports a job but their skill/repute in that specific finish is low.
