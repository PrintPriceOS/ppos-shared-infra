// tests/chaos_engineering.js
const { queue: sharedQueue } = require('../ppos-shared-infra');

/**
 * Chaos Validation Suite (Phase R13 - H4)
 * Pruebas de resiliencia ante inyección de fallos.
 */
async function runChaosTest() {
    console.log('--- 🧪 PRINTPRICE OS CHAOS ENGINE STARTING ---');
    
    // Escenario 1: Worker Poison Pill
    console.log('\n[SCENARIO 1] Injecting Poison Pill...');
    await sharedQueue.preflightQueue.add('analyze', {
        id: 'chaos_poison_pill',
        data: {
            asset_path: '/dev/urandom', // Invalid file that might cause crash
            operation: 'analyze',
            tenant_id: 'chaos_tenant'
        }
    }, { attempts: 3, backoff: 1000 });
    console.log('✅ Poison pill enqueued. Expected behavior: RetryManager triggers CircuitBreaker.');

    // Escenario 2: Redis Latency Simulation (Conceptual)
    console.log('\n[SCENARIO 2] Redis Pressure Simulation...');
    const floodSize = 100;
    const promises = [];
    for (let i = 0; i < floodSize; i++) {
        promises.push(sharedQueue.preflightQueue.add('analyze', {
            id: `chaos_flood_${i}`,
            data: { operation: 'analyze', tenant_id: 'flood_tenant' }
        }));
    }
    await Promise.all(promises);
    console.log(`✅ Flooded queue with ${floodSize} jobs. Expected: Service remains responsive via SLO Evaluation.`);

    // Escenario 3: Infrastructure Restart (Conceptual)
    console.log('\n[SCENARIO 3] Concept: Infrastructure Bounce');
    console.log('Manual Action Required: Run "docker restart redis" during flood.');
    console.log('Expected: Workers reconnect automatically via ioredis logic.');

    console.log('\n--- 🧪 CHAOS ENGINE COMPLETE ---');
    process.exit(0);
}

runChaosTest().catch(console.error);
