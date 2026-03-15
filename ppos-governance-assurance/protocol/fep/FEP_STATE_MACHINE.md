# FEP State Machines

## 1. Entity Lifecycles
FEP entities follow deterministic state transitions managed by `fepStateTransitionResolver`.

### 1.1 Production Request Lifecycle
```mermaid
stateDiagram-v2
    [*] --> draft
    draft --> published: Request Publication
    published --> matched: Offer Validated
    matched --> assigned: Assignment Accepted
    assigned --> in_production: Production Started
    in_production --> completed: Final Delivery
    
    published --> expired: Deadline Reached
    matched --> cancelled: User Action
    assigned --> disputed: Exception Reported
```

### 1.2 Production Offer Lifecycle
```mermaid
stateDiagram-v2
    [*] --> draft
    draft --> submitted: Message Sent
    submitted --> shortlisted: Evaluation
    shortlisted --> accepted: Assignment Proposed
    
    submitted --> rejected: Evaluation Failed
    shortlisted --> withdrawn: Node Action
    accepted --> void: Request Cancelled
```

### 1.3 Assignment Lifecycle
```mermaid
stateDiagram-v2
    [*] --> pending
    pending --> proposed: Contract Shared
    proposed --> active: Acceptance Record
    active --> executing: First Status Update
    executing --> completed: Handover Confirmed
    
    active --> terminated: Policy Violation
    executing --> disputed: quality/delay Issue
```

## 2. Transition Rules
Each transition MUST define:
- **Trigger**: The FEP message type or system event.
- **Actor**: The specific node authorized to initiate the change.
- **Preconditions**: Governance and trust assertions required.
- **Evidence**: Mandatory links to `evidenceEnvelope`.
