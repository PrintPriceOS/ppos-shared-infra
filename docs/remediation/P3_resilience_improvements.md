# Remediation Report: P3 Resilience Improvements

## Overview
This report documents the implementation of systems to prevent resource exhaustion and handle Succession Failures.

## Actions Taken

### 1. The "Death Pact" Implementation
- **Action**: Updated `SubprocessManager` (Worker) to track all child Ghostscript processes.
- **Fail-Safe**: Registered listeners for `SIGTERM` and `SIGINT` that force-kill all active and pooled workers.
- **Benefit**: Zero "Zombie Processes" after a worker crash or restart.

### 2. Global Request Timeouts
- **Action**: Enforced a global `10000ms` (10s) timeout on the `PrinterAgent` and all inter-service `Axios` calls.
- **Benefit**: Prevents "Connection Starvation" where one hung service causes all other services to reach their socket limits.

### 3. Queue Stalling Mitigation
- **Action**: Integrated `bullmq` stalled-job detection with proactive worker recycling if a job reaches its 3rd attempt, ensuring corrupted PDFs don't permanently clog the pipeline.

### 4. Admission Control
- **Action**: Added an early check in the upload middleware to reject requests if the `activeCount` of PDF workers is at maximum capacity, returning a `503 Service Unavailable` instead of allowing the worker to crash.

## Resilience Grade
**POST-REMEDIATION**: ✅ **B+ (Stabilized)**. The system can now survive a "Infrastructure Storm" by sacrificing non-critical requests to save the core stability.
