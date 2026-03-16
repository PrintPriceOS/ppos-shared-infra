'use strict';

/**
 * services/queue.js
 * 
 * Decoupled Queue Bridge — Phase 18.C.
 * Instead of local BullMQ, this delegates enqueuing to the PPOS Preflight Service.
 */

const axios = require('axios');
const pposConfig = require('../../config/ppos');
const PPOS_URL = pposConfig.preflightServiceUrl;

/**
 * Handles PPOS Service errors with a consistent product policy.
 */
function handleServiceError(error, context) {
    const status = error.response ? error.response.status : 'NETWORK_ERROR';
    const message = error.response?.data?.error || error.message;
    
    console.error(`[PPOS-INTEGRATION-ERROR][${context}] Status: ${status} | Message: ${message}`);
    
    if (pposConfig.environment !== 'production') {
        console.warn(`[QUEUE] Non-production environment detected. Falling back to local mock.`);
        return { id: `mock-${Date.now()}`, status: 'LOCAL_PENDING' };
    }

    const productError = new Error(`Queue Service ${context} failed: ${message}`);
    productError.status = status;
    productError.code = 'PPOS_QUEUE_FAILURE';
    throw productError;
}

/**
 * Enqueue a job to the PPOS platform.
 * @param {string} type - 'PREFLIGHT' or 'AUTOFIX'
 * @param {object} payload - Job data
 */
async function enqueueJob(type, payload) {
    console.log(`[QUEUE] Delegating ${type} job to PPOS Service...`);
    
    try {
        // Enforce boundary: product app doesn't process, it only requests.
        const response = await axios.post(`${PPOS_URL}${pposConfig.routes.autofix}`, {
            asset_id: payload.asset_id,
            policy: payload.policy || 'DEFAULT',
            tenant_id: payload.tenant_id,
            metadata: {
                origin: 'preflight-product-app',
                tenant_id: payload.tenant_id,
                timestamp: new Date().toISOString(),
                environment: pposConfig.environment
            }
        }, {
            timeout: pposConfig.timeoutMs,
            headers: pposConfig.apiKey ? { 'X-PPOS-API-KEY': pposConfig.apiKey } : {}
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
        return handleServiceError(err, 'ENQUEUE');
    }
}

module.exports = {
    enqueueJob
};






















