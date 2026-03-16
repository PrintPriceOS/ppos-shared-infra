/**
 * Federated Policy & Failover Test
 * 
 * Validates authority resolution, caching, and staleness detection.
 */
const PolicyAuthorityResolver = require('./ppos-shared-infra/packages/federation/PolicyAuthorityResolver');
const policyCacheManager = require('./ppos-shared-infra/packages/federation/PolicyCacheManager');
const RegionStalenessEvaluator = require('./ppos-shared-infra/packages/federation/RegionStalenessEvaluator');
const emergencyRestrictionManager = require('./ppos-shared-infra/packages/federation/EmergencyRestrictionManager');

function runTests() {
    console.log('--- STARTING FEDERATION CONTINUITY TESTS ---');

    // 1. Authority Resolver Test
    console.log('\n[1] Testing Policy Authority Resolution...');
    const resolver = new PolicyAuthorityResolver();
    const isEUAuth = resolver.isAuthorized('EU-PPOS-1');
    const isUSAuth = resolver.isAuthorized('US-PPOS-1');
    
    console.log(`EU-PPOS-1 Authorized: ${isEUAuth}`);
    console.log(`US-PPOS-1 Authorized: ${isUSAuth} (Expected: false)`);
    if (isEUAuth && !isUSAuth) console.log('✅ PASS: Authority correctly restricted to Global Hub.');

    // 2. Cache & Staleness Test
    console.log('\n[2] Testing Cache Freshness & Staleness...');
    const evaluator = new RegionStalenessEvaluator();
    
    // Scenario: Just synced
    const freshStatus = evaluator.evaluate(new Date().toISOString());
    console.log(`Fresh Sync Status: ${freshStatus}`);
    
    // Scenario: 40 mins ago
    const staleTime = new Date(Date.now() - 2400 * 1000).toISOString();
    const staleStatus = evaluator.evaluate(staleTime);
    console.log(`Stale Sync Status: ${staleStatus} (at 40m lag)`);
    
    if (freshStatus === 'HEALTHY' && staleStatus === 'STALE') {
        console.log('✅ PASS: Staleness correctly detected based on lag.');
    }

    // 3. Emergency Restriction Test
    console.log('\n[3] Testing Emergency Local Restrictions...');
    const decision = { allow: true, capability: 'PrinterOnboarding' };
    
    // Normal mode
    const d1 = emergencyRestrictionManager.enforce(decision);
    console.log(`Normal Mode Decision: ${d1.allow}`);

    // Emergency mode: restrict onboarding
    emergencyRestrictionManager.restrict('PrinterOnboarding');
    const d2 = emergencyRestrictionManager.enforce(decision);
    console.log(`Emergency Mode Decision: ${d2.allow} | Reason: ${d2.reason}`);

    if (d1.allow && !d2.allow && d2.reason === 'EMERGENCY_LOCAL_RESTRICTION') {
        console.log('✅ PASS: Emergency overlay correctly blocked capability.');
    }

    console.log('\n--- FEDERATION CONTINUITY TESTS COMPLETED ---');
}

runTests();
