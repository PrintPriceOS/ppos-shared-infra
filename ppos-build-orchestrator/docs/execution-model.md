# Execution Model — Industrial Build Orchestrator

## State Machine
The orchestrator operates on a multi-level state machine:

### Program States
`defined` → `resolved` → `bootstrapped` → `provisioned` → `hydrated` → `published` → `verified` → `promotable`

### Story States
`planned` → `ready` → `assigned` → `in_progress` → `verified` → `done`

## Workflow Phases
1. **Resolution**: Mapping blueprint to build plan.
2. **Provisioning**: Physical repo creation.
3. **Activation**: CI/CD and Issue publication.
4. **Validation**: Gate evaluation and evidence collection.
