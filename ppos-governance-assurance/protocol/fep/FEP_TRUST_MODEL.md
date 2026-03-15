# FEP Trust Model

## 1. Trust Propagation
Trust in FEP is not binary; it is a multi-dimensional score propagated via `trust_assertion` messages.

## 2. Trust Tiers
Nodes are categorized into tiers, which affect their eligibility for certain protocol actions.

| Tier | Eligibility | Default Score Range |
| :--- | :--- | :--- |
| `verified_partner` | All actions enabled. | 0.90 - 1.00 |
| `standard_node` | Offer submission enabled. | 0.70 - 0.89 |
| `restricted` | View only. | 0.40 - 0.69 |
| `suspended` | All protocol actions blocked.| 0.00 - 0.39 |

## 3. The Trust Block
Every message MAY include a `trust` block for real-time validation.

```json
{
  "trustTier": "verified_partner",
  "trustScore": 0.94,
  "reliabilityScore": 0.91,
  "trustAssertionId": "trust_assert_uuid"
}
```

## 4. Enforcement Thresholds
- **Offer Submission**: Requires `trustScore >= 0.70`.
- **Assignment Activation**: Requires `trustScore >= 0.85` or explicit governance waiver.
- **Capability Exposure**: `partner_only` exposure levels require `verified_partner` tier.

## 5. Trust Decay & Recovery
Trust scores are updated based on `execution_exception_event` (decay) and `execution_completed_event` (recovery).
These calculations are handled by the `fepTrustAssertionService`.
