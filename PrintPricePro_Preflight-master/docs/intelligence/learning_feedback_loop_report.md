# Learning Feedback Loop — Phase R9

## 1. The Outcome Loop
The network "learns" by closing the gap between **Predicted Intent** and **Actual Result**.

### Canonical Feedback Signals
| Event | Metadata | Intelligence Impact |
| :--- | :--- | :--- |
| **Production Completion**| `completion_time_delta` | Refines Node Speed expectations. |
| **Asset Download** | `download_start_latency`| Detects Node Connection Health. |
| **Quality Audit** | `rejection_count` | Impacts Node Trust & Quality Rank. |
| **Shipping Confirmation**| `carrier_latency` | Refines Proximity / Time-to-Door scores. |

## 2. Event Format (Sample)
```json
{
  "job_id": "job-12345",
  "printer_id": "printer-node-99",
  "outcome": {
    "status": "completed",
    "actual_vs_promised_ms": -3600000,
    "quality_score": 1.0,
    "feedback_loop_synced": true
  }
}
```

## 3. Continuous Improvement Cycle
1. **Log**: Every production event is emitted via `ProductionOutcomeEvent`.
2. **Aggretate**: `learningFeedbackService` analyzes trends per node/region.
3. **Weight Update**: Decision weights for future jobs are adjusted (e.g., if Node X is consistently 1 hour late, its predicted delay risk increases).

## 4. Results
The network is **Self-Correcting**. Poor performers lose rank automatically, and reliable specialist nodes gain "Preferred" status without manual intervention.
