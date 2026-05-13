// ppos-shared-infra/scripts/test-preflight-contracts.js

const assert = require('assert');
const { 
    PreflightIntegrityContract, 
    FAILURE_CATEGORIES, 
    SCORE_BASIS 
} = require('../index.js');

function runTests() {
    console.log('--- Preflight Orchestration Contracts Unit Validation ---');

    // Test 1: Contradictory payload resolution
    console.log('[TEST 1] Validating contradictory payload canonical normalization...');
    const contradictoryPayload = {
        analysis_type: 'DEGRADED',
        analysis_status: 'DEGRADED',
        missing_tools: 'pdfimages, pdfinfo, mutool',
        risk_score: 85,
        certification: {
            allowed: true,
            certified: true
        },
        analysisIntegrity: {
            degradedMode: false,
            realExtraction: true
        }
    };

    const normalized1 = PreflightIntegrityContract.normalizeJobPayload(contradictoryPayload);
    
    // Acceptance Criteria 1: No payload can contain analysis_type: DEGRADED with analysisIntegrity.degradedMode: false
    assert.strictEqual(normalized1.analysisIntegrity.degradedMode, true, 'degradedMode must be normalized to true');
    
    // Acceptance Criteria 2: No payload can contain missing tools while claiming realExtraction: true
    assert.strictEqual(normalized1.analysisIntegrity.realExtraction, false, 'realExtraction must be false when tools are missing');
    assert.deepStrictEqual(normalized1.analysisIntegrity.missingTools, ['pdfimages', 'pdfinfo', 'mutool'], 'missingTools must be parsed as an array');
    
    // Acceptance Criteria 3: Risk score is null or scoreBasis=ENVIRONMENT_FAILURE when environment is invalid
    assert.strictEqual(normalized1.risk_score, null, 'risk_score must be nullified when environment fails');
    assert.strictEqual(normalized1.analysisIntegrity.scoreBasis, SCORE_BASIS.ENVIRONMENT_FAILURE, 'scoreBasis must be ENVIRONMENT_FAILURE');
    
    // Acceptance Criteria 4: Certification is impossible when analysis integrity is degraded
    assert.strictEqual(normalized1.certification_possible, false, 'certification_possible must be false');
    assert.strictEqual(normalized1.certification.allowed, false, 'certification.allowed must be false');
    assert.strictEqual(normalized1.certification.certified, false, 'certification.certified must be false');

    console.log('✅ Test 1 Passed: Contradictory payload flawlessly canonicalized.');

    // Test 2: ENOENT extraction errors triggers invariant
    console.log('[TEST 2] Validating ENOENT extraction errors enforcement...');
    const enoentPayload = {
        extractionErrors: [{ code: 'ENOENT', syscall: 'spawn pdfinfo' }],
        riskScore: 42
    };

    const normalized2 = PreflightIntegrityContract.normalizeJobPayload(enoentPayload);
    assert.strictEqual(normalized2.analysisIntegrity.degradedMode, true, 'degradedMode must be true for ENOENT');
    assert.strictEqual(normalized2.analysisIntegrity.blockingEnvironmentFailure, true, 'blockingEnvironmentFailure must be true');
    assert.strictEqual(normalized2.riskScore, null, 'riskScore must be nullified');

    console.log('✅ Test 2 Passed: ENOENT invariant correctly enforced.');

    // Test 3: Standard Non-degraded successful extraction
    console.log('[TEST 3] Validating standard real extraction preservation...');
    const realPayload = {
        analysis_type: 'REAL_EXTRACTION',
        analysis_status: 'SUCCESS',
        risk_score: 12,
        certification: {
            allowed: true,
            certified: true
        },
        analysisIntegrity: {
            degradedMode: false,
            realExtraction: true
        }
    };

    const normalized3 = PreflightIntegrityContract.normalizeJobPayload(realPayload);
    assert.strictEqual(normalized3.analysisIntegrity.degradedMode, false);
    assert.strictEqual(normalized3.analysisIntegrity.realExtraction, true);
    assert.strictEqual(normalized3.risk_score, 12, 'risk_score preserved');
    assert.strictEqual(normalized3.certification.certified, true, 'certification preserved');

    console.log('✅ Test 3 Passed: Standard job unmodified.');

    // Test 4: Downstream Override Protection (Task 8)
    console.log('[TEST 4] Validating downstream services cannot override DEGRADED into REAL_EXTRACTION...');
    const upstreamPayload = {
        analysis_type: 'DEGRADED',
        analysisIntegrity: {
            degradedMode: true,
            realExtraction: false,
            fallbackUsed: true
        }
    };

    // Malicious or misbehaving downstream service attempts to mark realExtraction: true
    const maliciousDownstreamUpdate = {
        analysis_type: 'REAL_EXTRACTION',
        analysis_status: 'SUCCESS',
        risk_score: 90,
        analysisIntegrity: {
            degradedMode: false,
            realExtraction: true
        }
    };

    const protectedPayload = PreflightIntegrityContract.enforceDownstreamIntegrity(upstreamPayload, maliciousDownstreamUpdate);
    assert.strictEqual(protectedPayload.analysisIntegrity.degradedMode, true, 'Override must be reverted back to degradedMode: true');
    assert.strictEqual(protectedPayload.analysisIntegrity.realExtraction, false, 'realExtraction must be reverted back to false');
    assert.strictEqual(protectedPayload.analysis_type, 'DEGRADED', 'analysis_type must be reverted to DEGRADED');
    assert.strictEqual(protectedPayload.risk_score, null, 'risk_score must be nullified if environment failure persists');

    console.log('✅ Test 4 Passed: Downstream override blocked securely.');

    // Test 5: Orchestration Job Rejection mapping (Task 5 & 6)
    console.log('[TEST 5] Validating orchestration rejection and severity classification...');
    const badEnvPayload = {
        missing_tools: ['pdfinfo', 'mutool']
    };

    const orchestrationResult = PreflightIntegrityContract.orchestratePreflightJob(badEnvPayload);
    assert.strictEqual(orchestrationResult.accepted, false);
    assert.strictEqual(orchestrationResult.status, 'FAILED_RUNTIME_ENVIRONMENT');
    assert.strictEqual(orchestrationResult.failureCategory, FAILURE_CATEGORIES.ENGINE_ENVIRONMENT_FAILURE);
    assert.strictEqual(orchestrationResult.payload.job_status, 'FAILED_RUNTIME_ENVIRONMENT');
    
    const classification = PreflightIntegrityContract.classifyFailure(orchestrationResult.payload);
    assert.strictEqual(classification.severity, 'CRITICAL');
    assert.strictEqual(classification.isRuntimeFailure, true);
    assert.strictEqual(classification.isDocumentDefect, false);

    console.log('✅ Test 5 Passed: Orchestration rejects and maps to infrastructure runtime failure correctly.');

    console.log('\n🚀 ALL CONTRACT INTEGRITY TESTS COMPLETED SUCCESSFULLY.');
}

try {
    runTests();
    process.exit(0);
} catch (err) {
    console.error('❌ Unit test validation failed:', err);
    process.exit(1);
}
