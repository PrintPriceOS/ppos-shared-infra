'use strict';

/**
 * services/queue.js
 * 
 * Decoupled Queue Bridge — Phase 18.C.
 * Instead of local BullMQ, this delegates enqueuing to the PPOS Preflight Service.
 */

const axios = require('axios');
const PPOS_URL = process.env.PPOS_PREFLIGHT_SERVICE_URL || 'http://localhost:3000';

/**
 * Enqueue a job to the PPOS platform.
 * @param {string} type - 'PREFLIGHT' or 'AUTOFIX'
 * @param {object} payload - Job data
 */
async function enqueueJob(type, payload) {
    console.log(`[QUEUE] Delegating ${type} job to PPOS Service...`);
    
    try {
        // Enforce boundary: product app doesn't process, it only requests.
        const response = await axios.post(`${PPOS_URL}/api/jobs/enqueue`, {
            type,
            payload,
            metadata: {
                origin: 'preflight-product-app',
                tenant_id: payload.tenant_id,
                timestamp: new Date().toISOString()
            }
        });

        if (response.data && response.data.job_id) {
            console.log(`[QUEUE] PPOS Job created: ${response.data.job_id}`);
            return {
                id: response.data.job_id,
                status: 'QUEUED'
            };
        }

        throw new Error('PPOS Service returned invalid job response');
    } catch (err) {
        console.error(`[QUEUE-ERROR] Failed to enqueue to PPOS: ${err.message}`);
        // Fallback for verification/dev: return a local mock ID if PPOS is unreachable (non-production only)
        if (process.env.NODE_ENV !== 'production') {
             return { id: `mock-${Date.now()}`, status: 'LOCAL_PENDING' };
        }
        throw err;
    }
}

module.exports = {
    enqueueJob
};
