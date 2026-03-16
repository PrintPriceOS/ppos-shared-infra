# Automatic Drift Reconciliation

## Overview
Detects and corrects state divergence between regions without manual operator intervention.

## Reconciliation Policies

### 1. Targeted Replay (Low Severity)
* **Trigger**: Checksum mismatch in a specific domain (e.g., `tenant`).
* **Action**: `ReplayEngine` performs an incremental scan from the last known-good checkpoint.
* **Outcome**: Local state is converged to match the global authority.

### 2. Domain Quarantine (High Severity)
* **Trigger**: Persistent drift after reconciliation or Authority Mismatch.
* **Action**: Data processing for the domain is halted.
* **Outcome**: Operators are alerted; "Safety First" mode active.

### 3. Circuit Breaker (Entity Level)
* **Trigger**: $N$ failures for a specific `entity_id`.
* **Action**: Entity is `BLACKHOLED`.
* **Outcome**: Toxic data is isolated while the rest of the region remains healthy.
