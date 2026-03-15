// ppos-printer-agent/agent.js
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

/**
 * PrintPrice OS Printer Agent (Phase 23.B.7 Prototype)
 * Lightweight reference implementation for federated partners.
 */
class PrinterAgent {
    constructor(config) {
        this.baseUrl = config.baseUrl;
        this.printerId = config.printerId;
        this.keyId = config.keyId;
        this.secret = config.secret;
        this.pollInterval = 60000;
        
        // Phase P3: Resilience - Global Timeout Enforcement
        axios.defaults.timeout = 10000; // 10s industrial limit
    }

    /**
     * Compute HMAC signature for security headers
     */
    _signRequest(method, path, body = {}) {
        const timestamp = new Date().toISOString();
        const nonce = crypto.randomBytes(16).toString('hex');
        const bodyStr = JSON.stringify(body);
        const bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex');
        
        const stringToSign = `${method.toUpperCase()}|${path}|${timestamp}|${nonce}|${bodyHash}`;
        const signature = crypto
            .createHmac('sha256', this.secret)
            .update(stringToSign)
            .digest('hex');

        return {
            'x-printer-id': this.printerId,
            'x-key-id': this.keyId,
            'x-timestamp': timestamp,
            'x-nonce': nonce,
            'x-signature': signature,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Send heartbeat to Control Plane
     */
    async sendHeartbeat() {
        const path = '/api/federation/heartbeat';
        const body = {
            availabilityState: 'available',
            queueDepth: 0,
            loadPercent: 0
        };

        try {
            console.log(`[AGENT] Sending heartbeat for ${this.printerId}...`);
            const headers = this._signRequest('POST', path, body);
            await axios.post(`${this.baseUrl}${path}`, body, { headers });
            console.log('[AGENT] Heartbeat accepted.');
        } catch (err) {
            console.error('[AGENT] Heartbeat failed:', err.response?.data || err.message);
        }
    }

    /**
     * Poll for available jobs
     */
    async pollJobs() {
        const path = '/api/federation/jobs/available';
        try {
            console.log('[AGENT] Polling for jobs...');
            const headers = this._signRequest('GET', path, {});
            const { data } = await axios.get(`${this.baseUrl}${path}`, { headers });
            
            if (data.offers && data.offers.length > 0) {
                console.log(`[AGENT] Found ${data.offers.length} offers!`);
                
                // Demo: Auto-accept the first offer
                const offer = data.offers[0];
                console.log(`[AGENT] Auto-accepting offer ${offer.id} for Job ${offer.job_id}...`);
                const acceptPath = `/api/federation/jobs/${offer.id}/accept`;
                const authHeaders = this._signRequest('POST', acceptPath, {});
                await axios.post(`${this.baseUrl}${acceptPath}`, {}, { headers: authHeaders });
                console.log('[AGENT] Offer accepted. Proceeding to Job Package (23.D)...');

                // 2. Fetch Package Manifest
                const pkgPath = `/api/federation/jobs/${offer.id}/package`;
                const pkgHeaders = this._signRequest('GET', pkgPath, {});
                const { data: pkg } = await axios.get(`${this.baseUrl}${pkgPath}`, { headers: pkgHeaders });
                console.log('[AGENT] Package manifest received:', pkg.id);

                // 3. Simulate Asset Downloads & integrity Check
                for (const asset of pkg.assets) {
                    console.log(`[AGENT] Downloading asset: ${asset.type} from ${asset.url.substring(0, 40)}...`);
                    // In real agent: axios.get(asset.url) -> verify sha256
                    console.log(`[AGENT] Verification successful (sha256: ${asset.sha256})`);
                }

                // 4. Confirm Downloaded
                const dlPath = `/api/federation/jobs/${offer.id}/package/downloaded`;
                await axios.post(`${this.baseUrl}${dlPath}`, {}, { headers: this._signRequest('POST', dlPath, {}) });
                console.log('[AGENT] Download confirmation sent.');

                // 5. Final Handshake: Received
                const recPath = `/api/federation/jobs/${offer.id}/received`;
                await axios.post(`${this.baseUrl}${recPath}`, {}, { headers: this._signRequest('POST', recPath, {}) });
                console.log('[AGENT] Final handshake completed: RECEIVED_BY_PRINTER');

                // 6. Simulate Production States (Phase 23.E)
                const mockStates = ['QUEUED_AT_PRINTER', 'PRINTING', 'COMPLETED'];
                for (const state of mockStates) {
                    await new Promise(r => setTimeout(r, 2000)); // Simulating physical process
                    await this.reportStatus(offer.id, state, `Auto-reporting ${state} from prototype.`);
                }
            } else {
                console.log('[AGENT] No jobs currently available.');
            }
            
            this.pollInterval = (data.pollAfterSeconds || 60) * 1000;
        } catch (err) {
            console.error('[AGENT] Polling failed:', err.response?.data || err.message);
        }
    }

    /**
     * Report production status (Phase 23.E)
     */
    async reportStatus(dispatchId, newState, reason = '') {
        const path = `/api/federation/jobs/${dispatchId}/status`;
        const body = { newState, reason };
        try {
            console.log(`[AGENT] Reporting status: ${newState} for ${dispatchId}...`);
            const headers = this._signRequest('POST', path, body);
            await axios.post(`${this.baseUrl}${path}`, body, { headers });
            console.log(`[AGENT] Status ${newState} accepted.`);
        } catch (err) {
            console.error(`[AGENT] Status report failed:`, err.response?.data || err.message);
        }
    }

    start() {
        console.log(`[BOOT] PrintPrice OS Printer Agent starting for Printer: ${this.printerId}`);
        
        // Heartbeat Loop (60s)
        setInterval(() => this.sendHeartbeat(), 60000);
        
        // Polling Loop
        const pollLoop = async () => {
            await this.pollJobs();
            setTimeout(pollLoop, this.pollInterval);
        };
        pollLoop();

        // Send initial heartbeat
        this.sendHeartbeat();
    }
}

// Entry point (Manual run or integration)
if (require.main === module) {
    const config = {
        baseUrl: process.env.PPOS_API_URL || 'http://localhost:8081',
        printerId: process.env.PRINTER_ID,
        keyId: process.env.PRINTER_KEY_ID,
        secret: process.env.PRINTER_SECRET
    };

    if (!config.printerId || !config.secret) {
        console.error('FATAL: PRINTER_ID and PRINTER_SECRET must be set in env.');
        process.exit(1);
    }

    const agent = new PrinterAgent(config);
    agent.start();
}

module.exports = PrinterAgent;
