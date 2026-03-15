# Autonomous Intelligence Architecture — PrintPrice OS

**Layer**: Decision Intelligence (R9)
**Status**: DESIGNED
**Scope**: Platform-wide predictive orchestration.

## 1. Intelligence Service Topology
The intelligence layer operates as a **cross-cutting orchestration surface** above the Federated Print Network (R8).

```mermaid
graph TD
    UI[Product App / UI] --> CP[Control Plane]
    CP --> PI[Production Intelligence Service]
    
    subgraph "Intelligence Core (R9)"
        PI --> PS[Printer Scoring Engine]
        PI --> RR[SLA Risk Engine]
        PI --> RO[Routing Optimization Engine]
        PI --> AI[Pricing Intelligence Engine]
        PI --> LB[Learning Feedback Loop]
    end
    
    subgraph "Federated Network (R8)"
        PS --> PR[Printer Registry]
        RO --> MM[Matchmaker Service]
        AI --> OS[Offer Service]
    end
    
    LB -.-> |Signal Feedback| PS
    LB -.-> |Historical Bias| RR
```

## 2. Core Intelligent Services

| Service | Responsibility | Canonical Hook |
| :--- | :--- | :--- |
| **productionIntelligenceService** | Central entry point for all decision logic. | `MatchmakerService` |
| **printerScoringEngine** | Ranks nodes by capability + historical performance. | `RegistryService` |
| **slaRiskEngine** | Predicts probability of delivery / quality failure. | `DispatchService` |
| **routingOptimizationEngine** | Calculates optimal utility (Price + Time + Risk). | `OfferMarket` |
| **pricingIntelligenceEngine** | Detects anomalies and strategic pricing opportunities.| `OfferMarket` |
| **learningFeedbackService** | Ingests post-production signals to train models. | `ProductionState` |

## 3. Data Inputs & Context
- **Static**: Machine technical capabilities, location, SLA tier.
- **Dynamic**: Real-time queue depth, recent heartbeat latency.
- **Historical**: Success/failure rates, delay statistics, quality audit signals.
- **Network**: Market average prices, regional congestion markers.

## 4. Decision Lifecycle
1. **Request**: System receives a job intent.
2. **Expansion**: Intelligence layer enriches the request with risk and reliability markers.
3. **Execution**: Optimization engine calculates best candidates.
4. **Validation**: Governance guardrails check the decision.
5. **Observation**: Actual outcome is recorded to update future weights.
