# FEP Versioning & Compatibility

## 1. Versioning Strategy
FEP follows Semantic Versioning 2.0.0 (`MAJOR.MINOR.PATCH`).

- **MAJOR**: Incompatible protocol changes (e.g., changing the envelope structure).
- **MINOR**: Backward-compatible functionality additions (e.g., new message types).
- **PATCH**: Backward-compatible bug fixes or documentation updates.

## 2. Compatibility Matrix

| Node A (v1) | Node B (v2) | Compatibility Status |
| :--- | :--- | :--- |
| 1.0.0 | 1.0.1 | **Compatible** (Patch level) |
| 1.0.0 | 1.1.0 | **Forward Compatible** (A ignores new fields from B) |
| 1.1.0 | 1.0.0 | **Backward Compatible** (B ignores fields it doesn't know) |
| 1.x.y | 2.0.0 | **Incompatible** (Strict rejection) |

## 3. Version Negotiation
Nodes specify their supported FEP version in the `protocol` block of every message.
Receiving nodes MUST validate the version before processing the payload.

## 4. Upgrade Policy
- Nodes SHOULD support the current and previous MINOR versions.
- If a MAJOR version is released, a transition period with dual-version support for hubs is recommended.
- Incompatible version detection MUST result in a `protocol_error` message with code `COMPATIBILITY_ERROR`.
