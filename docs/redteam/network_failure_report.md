# Red Team Report: Network Disruption & Latency

## Audit Objective
Expose hidden timeouts and connection assumptions by simulating unstable network conditions between services.

## Network Weaknesses Exposed

### 🕸️ Weakness 1: The "Infinite Hang" (Missing Timeouts)
- **Observation**: `axios` calls in `pdfPipeline.js` (delegated execution) do not explicitly define a `timeout`.
- **Attack**: Set `PPOS_PREFLIGHT_SERVICE_URL` to a non-responsive IP or use a "Traffic Shaper" to introduce 30s latency.
- **Result**: The API request hangs. Because Node.js is single-threaded for I/O, many hanging requests can saturate the connection pool and exhaust the "Max Sockets" limit.
- **Impact**: 🛑 **Connection Starvation**. New users cannot connect because the server is waiting on hung backend calls.

### 🕸️ Weakness 2: "TCP Surge" (Lack of Backpressure)
- **Observation**: The `server.js` rate limits are per-IP, but they don't account for total system load.
- **Attack**: Simultaneous burst of large PDF uploads.
- **Result**: The server attempts to read and buffer all streams at once.
- **Impact**: 🛑 **Network Bandwidth Exhaustion**. The incoming pipe is saturated, killing the health-check and causing Nginx to declare a "502 Bad Gateway".

### 🕸️ Weakness 3: "DNS Fragility"
- **Observation**: Many internal services refer to each other by `localhost`.
- **Risk**: In a distributed deployment (Kubernetes/Swarm), `localhost` is incorrect. The system relies on host-level networking (`network_mode: host`) which is insecure and non-standard.
- **Impact**: 🛑 **Post-Deployment Connection Failure**.

## Resilience Assessment
- **Timeout Strategy**: 🛑 **INCONSISTENT**. Ghostscript has a 30s limit, but Axios/HTTP calls often have none.
- **Retry Logic**: ⚠️ **MISSING**. No exponential backoff for inter-service communication.

## Remediation Plan
1. **P0: Set Global Axios Timeouts**: Force a 10s timeout on all inter-service HTTP calls.
2. **P1: Implement Circuit Breaker**: Use the `resilience/CircuitBreakerService.js` to "open the circuit" if the Preflight Engine is slow, preventing the legacy app from hanging.
3. **P2: Define Internal Hostnames**: Replace `localhost` with environment variables like `CORE_HOST` and `ENGINE_HOST` that can be mapped via Docker DNS.
