# Outbox Relay
# PrintPrice OS — Federated Transport

The `OutboxRelay` is responsible for processing the local FSS outbox and reliably delivering signed events to remote regions.

## 1. Relay Lifecycle

1. **Scan**: The relay scans the `.runtime/fss-outbox/events.jsonl` file.
2. **Checkpointing**: It maintains a `checkpoint.json` to track the last successfully processed event, ensuring no duplicate transmission after restart.
3. **Signing**: Each event is signed using the `EventSigner` with the region's private key.
4. **Broadcast**: The signed envelope is sent to all configured peer regions via HTTP POST.
5. **Persistence**: The relay records delivery status.

## 2. Event Statuses

* **PENDING**: Event exists in outbox but has not been signed or sent.
* **SIGNED**: Event signature has been generated.
* **SENT**: Event has been successfully delivered to at least one peer.
* **ACKED**: Remote peer has confirmed receipt and acceptance.
* **FAILED_RETRYABLE**: Delivery failed due to network issues; will be retried in the next sweep.
* **FAILED_PERMANENT**: Event rejected by receiver (e.g., signature mismatch); requires manual investigation.

## 3. Configuration

The relay requires a mapping of `RegionID -> Endpoint`:

```json
{
  "destinations": {
    "EU-PPOS-1": "https://api.eu-ppos-1.printprice.os/fss/relay",
    "US-PPOS-1": "https://api.us-ppos-1.printprice.os/fss/relay"
  }
}
```

## 4. Retries and Fault Tolerance

* **Transient Failures**: 5xx errors or network timeouts trigger a retry in the next sweep (configurable backoff).
* **Permanent Failures**: 4xx errors (Invalid Signature, Unauthorized) stop retries for that specific event and trigger an `FSS_RELAY_CRITICAL` alert.
