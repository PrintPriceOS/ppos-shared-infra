# Inbox, Dedupe & Replay
# PrintPrice OS — Federated Transport

The receiving side of the Federated State Sync (FSS) uses an append-only inbox with strict deduplication to ensure eventual consistency across regions.

## 1. Inbox Persistence

Verified events are stored in `.runtime/fss-inbox/events.jsonl`. Each record includes:
* The original signed envelope.
* `received_at`: Local timestamp of reception.
* `process_status`: Current state of the event (RECEIVED, PENDING, APPLIED, FAILED).

## 2. Deduplication Index

The `RelayDedupeIndex` prevents the same event from being processed multiple times, which is critical for idempotent state transitions.
* **Storage**: `.runtime/fss-inbox/dedupe_index.json`.
* **Key**: `event_id` (UUID).
* **Value**: Timestamp of first reception.

## 3. Replay Engine

The `ReplayEngine` allows a region to re-process its inbox, useful for:
* Recovering after a crash during event application.
* Updating state after a bug fix in the application logic.
* Syncing after a period of offline operation.

### Replay Workflow:
1. Scan `events.jsonl` from a specific checkpoint or from the beginning.
2. For each event, invoke the `EventApplicationMVP` logic.
3. Update the `process_status` in the inbox logs.

## 4. Quarantine

Events that fail verification or authorization are moved to `.runtime/fss-quarantine/`.
* **Reasoning**: Prevents corrupting the main inbox while preserving evidence for operators.
* **Review**: Operators can manually inspect or "release" quarantined events if the block was erroneous.
