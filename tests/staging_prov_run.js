/**
 * V1.9.2 — Staging Proving Run
 * 
 * End-to-end validation of the Product -> PPOS integration.
 * Triggers analysis, autofix, and security checks.
 */
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');
require('dotenv').config();

const pposConfig = require('../config/ppos');

const TEST_PDF = path.resolve(__dirname, '../workspace/PrintPriceOS_Workspace/ppos-preflight-engine/tests/cli/fixtures/small_valid.pdf');
const SERVICE_URL = pposConfig.preflightServiceUrl;
const API_KEY = process.env.PPOS_API_KEY || 'test-key';

async function runProvingRun() {
    console.log('🚀 Starting V1.9.2 Staging Proving Run...');
    console.log(`📡 Targeting Service: ${SERVICE_URL}`);

    const results = {
        auth_test: false,
        analyze_test: false,
        autofix_test: false,
        health_check: false,
        worker_health: false,
        control_health: false
    };

    try {
        // 1. Health Checks
        console.log('\n[1/4] Verifying Service Health...');
        
        // Service
        try {
            const health = await axios.get(`${SERVICE_URL}/health`);
            console.log('✅ Preflight Service:', health.data.status);
            results.health_check = health.data.status === 'UP';
        } catch (e) {
            console.error('❌ Preflight Service health check failed:', e.message);
        }

        // Worker
        try {
            const workerHealth = await axios.get('http://localhost:8002/health');
            console.log('✅ Preflight Worker:', workerHealth.data.status);
            results.worker_health = workerHealth.data.status === 'UP';
        } catch (e) {
            console.error('❌ Preflight Worker health check failed:', e.message);
        }

        // Control Plane
        try {
            const controlHealth = await axios.get('http://localhost:8080/health');
            console.log('✅ Control Plane:', controlHealth.data.status);
            results.control_health = controlHealth.data.status === 'UP';
        } catch (e) {
            console.error('❌ Control Plane health check failed:', e.message);
        }

        // 2. Security Check (Negative Test)
        console.log('\n[2/4] Testing Unauthorized Access Rejection...');
        try {
            await axios.get(`${SERVICE_URL}/preflight/status/123`);
            console.error('❌ FAIL: Unauthorized request was accepted!');
        } catch (err) {
            if (err.response?.status === 401) {
                console.log('✅ PASS: Unauthorized request rejected (401)');
                results.auth_test = true;
            } else {
                console.error(`❌ Unexpected error: ${err.message}`);
                if (err.response) console.error('Response Status:', err.response.status);
            }
        }

        // 3. E2E Analyze (Real PDF)
        console.log('\n[3/4] Testing /analyze with real PDF...');
        if (!fs.existsSync(TEST_PDF)) {
            console.error(`❌ Test file not found at ${TEST_PDF}`);
        } else {
            try {
                const form = new FormData();
                form.append('file', fs.createReadStream(TEST_PDF));
                
                const analyzeRes = await axios.post(`${SERVICE_URL}/preflight/analyze`, form, {
                    headers: {
                        ...form.getHeaders(),
                        'x-ppos-api-key': API_KEY
                    },
                    timeout: 30000
                });
                console.log('✅ Analyze SUCCESS. Risk Level:', analyzeRes.data.api_report?.summary?.risk_level || analyzeRes.data.data?.summary?.risk_level);
                results.analyze_test = true;
            } catch (err) {
                console.error('❌ Analyze failed:', err.message);
                if (err.response) console.error('Response:', err.response.data);
            }
        }

        // 4. E2E Autofix (Real PDF)
        console.log('\n[4/4] Testing /autofix (Synchronous)...');
        try {
            const autofixForm = new FormData();
            autofixForm.append('file', fs.createReadStream(TEST_PDF));
            
            const autofixRes = await axios.post(`${SERVICE_URL}/preflight/autofix?fix=color`, autofixForm, {
                headers: {
                    ...autofixForm.getHeaders(),
                    'x-ppos-api-key': API_KEY
                },
                responseType: 'arraybuffer',
                timeout: 30000
            });
            
            if (autofixRes.status === 200 && autofixRes.data.length > 0) {
                console.log(`✅ Autofix SUCCESS. Received ${autofixRes.data.length} bytes.`);
                results.autofix_test = true;
            }
        } catch (err) {
            console.error('❌ Autofix failed:', err.message);
            if (err.response) console.error('Response:', err.response.data);
        }

    } catch (err) {
        console.error('\n🛑 PROVING RUN CRASHED:', err.message);
    }

    console.log('\n--- PROVING RUN SUMMARY ---');
    console.table(results);
    
    const allPassed = Object.values(results).every(v => v === true);
    if (allPassed) {
        console.log('\n✨ V1.9.2 CERTIFIED: System is operationally stable.');
        process.exit(0);
    } else {
        console.error('\n⚠️ V1.9.2 FAILED: Operational gaps detected.');
        process.exit(1);
    }
}

runProvingRun();
