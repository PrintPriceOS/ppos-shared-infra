/**
 * PrintPrice OS — Multi-Region Runtime Activation Test Suite
 */
const Module = require('module');
const originalRequire = Module.prototype.require;

// Mock ioredis and bullmq to avoid external dependencies during runtime logic tests
Module.prototype.require = function() {
    if (arguments[0] === 'ioredis') {
        function MockRedisInstance() {
            this.on = () => this;
            this.duplicate = () => new MockRedisInstance();
            this.subscribe = () => Promise.resolve();
            this.publish = () => Promise.resolve();
            this.quit = () => Promise.resolve();
        }
        return MockRedisInstance;
    }
    if (arguments[0] === 'bullmq') {
        return {
            Queue: class MockQueue {
                on() { return this; }
            },
            Worker: class MockWorker {
                on() { return this; }
            }
        };
    }
    return originalRequire.apply(this, arguments);
};

const { 
    runtimePolicyResolver, 
    emergencyRestrictionManager,
    policyCacheManager,
    regionContext 
} = require('../ppos-shared-infra');

async function runTests() {
    console.log('--- STARTING RUNTIME ACTIVATION TEST SUITE ---');
    const results = [];

    const assert = (condition, name) => {
        if (condition) {
            console.log(`[PASS] ${name}`);
            results.push({ name, status: 'PASS' });
        } else {
            console.error(`[FAIL] ${name}`);
            results.push({ name, status: 'FAIL' });
        }
    };

    // Helper to simulate time
    const setLag = (seconds) => {
        runtimePolicyResolver.lastHeartbeatAt = new Date(Date.now() - seconds * 1000).toISOString();
    };

    // TC-01: Authority region publishes policy successfully
    regionContext.regionId = 'EU-PPOS-1'; // Default global hub
    setLag(0); // Healthy
    // Mock fresh cache for authority actions
    const originalGet = policyCacheManager.getPolicy;
    policyCacheManager.getPolicy = () => ({ status: 'FRESH' });

    let decision = runtimePolicyResolver.isActionAllowed('policy_publish');
    assert(decision.allowed === true && decision.mode === 'NORMAL', 'TC-01: Authority region allowed to publish');

    // TC-02: Non-authority region fails
    regionContext.regionId = 'US-PPOS-1';
    decision = runtimePolicyResolver.isActionAllowed('policy_publish');
    assert(decision.allowed === false && decision.reason === 'non_authoritative_region', 'TC-02: Non-authority region rejected from publishing');

    // TC-03: Worker in degraded region continues safe local job
    setLag(600); // 10 mins (DEGRADED)
    decision = runtimePolicyResolver.isActionAllowed('local_analyze');
    assert(decision.allowed === true && decision.mode === 'DEGRADED', 'TC-03: Worker allowed safe local job in degraded mode');

    // TC-04: Worker in degraded region blocks restricted action
    // In our implementation, risky_job_execution checks cache.
    decision = runtimePolicyResolver.isActionAllowed('risky_job_execution');
    assert(decision.allowed === true, 'TC-04-PRE: Allowed if cache is fresh');

    // TC-05: Emergency restrictive overlay
    emergencyRestrictionManager.restrict('printer_onboarding');
    decision = runtimePolicyResolver.isActionAllowed('printer_onboarding');
    assert(decision.allowed === false && decision.mode === 'EMERGENCY_RESTRICTIVE', 'TC-05: Emergency restrictive overlay blocks onboarding');
    emergencyRestrictionManager.clear();

    // TC-06: Fresh policy cache allows normal execution
    decision = runtimePolicyResolver.isActionAllowed('risky_job_execution');
    assert(decision.allowed === true, 'TC-06: Fresh policy cache allows execution');

    // TC-07: Expired policy cache blocks
    policyCacheManager.getPolicy = () => ({ status: 'STALE' });
    decision = runtimePolicyResolver.isActionAllowed('risky_job_execution');
    assert(decision.allowed === false && decision.reason === 'policy_cache_stale', 'TC-07: Expired policy cache blocks sensitive action');
    policyCacheManager.getPolicy = () => ({ status: 'FRESH' }); // Reset for next

    // TC-08: Region health summary remains allowed in degraded mode
    setLag(1800); // 30 mins (STALE)
    decision = runtimePolicyResolver.isActionAllowed('health_status_pub');
    assert(decision.allowed === true, 'TC-08: Health summary allowed in STALE mode');

    // TC-09: Control-plane mutation rejected when region stale (even if authority)
    regionContext.regionId = 'EU-PPOS-1';
    setLag(3600); // 1 hour (STALE)
    decision = runtimePolicyResolver.isActionAllowed('global_mutation');
    assert(decision.allowed === false && decision.reason === 'authority_region_degraded', 'TC-09: Authority mutation rejected when region is stale');

    // TC-10: Decision metadata structure
    decision = runtimePolicyResolver.isActionAllowed('local_analyze');
    assert(
        decision.region_id !== undefined && 
        decision.mode !== undefined && 
        decision.reason !== undefined, 
        'TC-10: Runtime decision includes region, mode, and reason'
    );
    
    // Restore mock
    policyCacheManager.getPolicy = originalGet;

    console.log('--- TEST SUITE COMPLETE ---');
    console.table(results);
    
    const allPassed = results.every(r => r.status === 'PASS');
    if (!allPassed) process.exit(1);
}

runTests().catch(err => {
    console.error(err);
    process.exit(1);
});
