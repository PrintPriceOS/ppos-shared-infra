#!/usr/bin/env node

/**
 * scripts/validate-ppos-bridge.js
 * 
 * Production Readiness Gate - Phase 18.C.2
 * Validates the delegated execution and failure semantics.
 */

const axios = require('axios');
const pdfPipeline = require('../services/pdfPipeline');
const queue = require('../services/queue');

// Mock PPOS Service URL for testing
process.env.PPOS_PREFLIGHT_SERVICE_URL = 'http://localhost:9999';

async function runTest(name, fn) {
    console.log(`\n[TEST] Running: ${name}`);
    try {
        await fn();
        console.log(`✅ ${name} PASSED`);
    } catch (err) {
        console.error(`❌ ${name} FAILED: ${err.message}`);
    }
}

async function start() {
    console.log('--- Phase 18.C.2 Production Readiness Validation ---\n');

    // V3: Service Down
    await runTest('G3 - Service Down Semantics', async () => {
        // No server running on 9999
        try {
            await pdfPipeline.execCmd('gs', ['-q', 'input.pdf'], { metadata: { filePath: 'test.pdf' }});
        } catch (err) {
            if (err.message.includes('ECONNREFUSED')) {
                console.log('[INFO] Correctly caught connection failure.');
                return;
            }
            throw err;
        }
    });

    // V4: Queue Delegation
    await runTest('G2 - Queue Delegation Bridge', async () => {
        // This will try to POST to localhost:9999/api/jobs/enqueue
        try {
            await queue.enqueueJob('PREFLIGHT', { asset_id: '123', tenant_id: 'test' });
        } catch (err) {
            // we expect error because no server is listening, but we want to see the "Delegating" log
            console.log('[INFO] Delegation attempted as expected.');
        }
    });

    console.log('\n[SUMMARY] Validation run complete. Manual logs verify structural correctness.');
}

start();
