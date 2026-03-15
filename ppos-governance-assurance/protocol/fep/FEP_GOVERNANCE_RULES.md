# FEP Governance Rules

## 1. Principles
Governance in FEP is decentralized but enforceable via protocol assertions.
- **Node Autonomy**: Every node defines its own acceptance policy.
- **Explicit Assertion**: Key actions MUST include a governance block.
- **Traceable Compliance**: Every approval must link to an evidence record.

## 2. Mandatory Assertions
The following message types REQUIRE a governance block:
- `assignment_proposed` / `assignment_accepted`
- `production_request_published`
- `trust_assertion`

## 3. Policy Profiles
Governance behavior is driven by profiles defined in `registry/fep_policy_profiles.json`.

| Profile | Strictness | Application |
| :--- | :--- | :--- |
| `fep_core` | Low | Internal test networks. |
| `fep_partner_network`| Medium | Verified third-party printers. |
| `fep_private_managed`| High | Enterprise exclusive deployments. |

## 4. Enforcement Logic
1. **Schema Check**: Is the governance block present and structured?
2. **Actor Check**: Is the signer authorized for this policy?
3. **Evidence Link**: Does the `assertionId` map to a valid evidence envelope?
4. **Tenant Isolation**: Does the message cross-tenant boundaries without proper proxy?
