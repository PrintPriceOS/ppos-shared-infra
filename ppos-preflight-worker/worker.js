const { Worker } = require('bullmq');
/**
 * Distributed Worker Adapter
 * 
 * Skeleton implementation for a job-based consumer.
 * Classification: RUNTIME_WORKER_ADAPTER
 */
const AnalyzeCommand = require('../ppos-preflight-engine/src/runtime/commands/analyzeCommand');
const AutofixCommand = require('../ppos-preflight-engine/src/runtime/commands/autofixCommand');

const { 
    policyEnforcementService, 
    resourceGovernanceService, 
    queue: sharedQueue,
    aiBudgetGovernanceService,
    circuitBreakerService,
    retryManager,
    resourceLifecycleService,
    metricsService,
    secretManager
} = require('../ppos-shared-infra');

const subprocessManager = require('./subprocess_manager');

class PreflightWorker {
    /**
     * Simulation of job processing.
     * In a real system, this would be a handler for Redis/RabbitMQ.
     */
    async processJob(job) {
        const { id: job_id, data } = job;
        const { operation, tenant_id, asset_path, config, output_path, governance } = data;
        const tId = tenant_id || (governance && governance.tenantId) || 'default';
        const pool = secretManager.get('WORKER_POOL') || 'POOL_A';

        console.log(`[WORKER][${pool}] Processing Job: ${job_id} | Op: ${operation} | Tenant: ${tId} | Attempt: ${job.attemptsMade}`);

        const governanceContext = {
            tenantId: tId,
            queueName: (governance && governance.queueName) || 'PREFLIGHT_PRIMARY',
            serviceName: 'ppos-preflight-worker',
            jobType: operation || (governance && governance.jobType),
            operation: 'execute'
        };

        // 1. Policy Gate (Phase 19.C.2)
        const decision = await policyEnforcementService.evaluate(governanceContext);

        if (!decision.allowed) {
            console.warn(`[GOVERNANCE-BLOCK] Job ${job_id} denied: ${decision.reason}`);
            throw new Error(`Governance Policy Enforcement: ${decision.reason}`);
        }

        // 2. Resource Gate: Reserve Concurrency (Phase 20.C.2)
        let resourceReserved = false;
        let aiBudgetReserved = false;
        let heartbeatInterval = null;

        // Estimate AI costs if applicable
        const isAIJob = operation === 'autofix' || data.requiresAI;
        const estimatedTokens = isAIJob ? 20000 : 0; 
        const estimatedCost = isAIJob ? 0.25 : 0;

        try {
            await resourceGovernanceService.reserveStart(job_id, tId);
            resourceReserved = true;

            // 2.1 AI Budget Reservation (Phase 20.E.5)
            if (isAIJob) {
                // Adaptive AI Circuit Breaker (Phase 21.C.1)
                const aiBreaker = await circuitBreakerService.checkAvailability('primary-llm', 'LLM');
                if (!aiBreaker.available) {
                    throw new Error(`AI Circuit Breaker Open: ${aiBreaker.reason}`);
                }

                const aiDecision = await aiBudgetGovernanceService.evaluateBudget({
                    tenantId: tId,
                    jobId: job_id,
                    modelTier: data.modelTier || 'standard'
                });

                if (!aiDecision.allowed) {
                    throw new Error(`AI Budget Exhausted: ${aiDecision.reason}`);
                }

                await aiBudgetGovernanceService.reserveBudget(job_id, tId, estimatedTokens, estimatedCost);
                aiBudgetReserved = true;
                
                if (aiDecision.decision === 'degrade') {
                    if (!data.config) data.config = {};
                    data.config.model_tier_hint = aiDecision.recommendedModelTier;
                }
            }

            // 2.2 Adaptive Heartbeat Lease (Phase 21.C.3)
            const heartbeatMs = pool === 'POOL_A' ? 20000 : 45000;
            heartbeatInterval = setInterval(async () => {
                const alive = await resourceGovernanceService.heartbeatLease(job_id);
                if (!alive) {
                    console.error(`[WORKER-CRITICAL] Capacity lease lost for job ${job_id}!`);
                }
            }, heartbeatMs);

            // 3. Protected Engine Execution (Phase 21.C.1, C.4 & 22.C)
            const engineBreaker = await circuitBreakerService.checkAvailability('preflight-engine', 'ENGINE');
            if (!engineBreaker.available) {
                throw new Error(`Engine Circuit Breaker Open: ${engineBreaker.reason}`);
            }

            let result;
            try {
                // Use Pre-Warmed Subprocess Manager for Pool A (Phase 22.C)
                if (pool === 'POOL_A') {
                    result = await subprocessManager.execute(operation, {
                        input: asset_path,
                        config: config,
                        output: output_path
                    }, {
                        timeout: 180000, 
                        memoryLimitMB: 1536 
                    });
                } else {
                    if (operation === 'analyze') {
                        result = await AnalyzeCommand.run(asset_path, config);
                    } else if (operation === 'autofix') {
                        result = await AutofixCommand.run(asset_path, output_path, config);
                    } else {
                        throw new Error(`Unknown operation: ${operation}`);
                    }
                }
                
                // Track success for breakers
                await circuitBreakerService.recordSuccess('preflight-engine');
                if (isAIJob) await circuitBreakerService.recordSuccess('primary-llm');

                // H3 Hardening: Record Success Metrics (Phase R13)
                const latency = Date.now() - (governance?.enqueuedAt ? new Date(governance.enqueuedAt).getTime() : Date.now());
                metricsService.recordJobResult(operation, 'SUCCEEDED', tId, latency);

            } catch (engineErr) {
                const classification = retryManager.classify(engineErr);
                
                if (classification === 'DEPENDENCY_UNAVAILABLE' || classification === 'TRANSIENT') {
                    await circuitBreakerService.recordFailure('preflight-engine', 'ENGINE');
                    if (isAIJob) await circuitBreakerService.recordFailure('primary-llm', 'LLM');
                }

                throw engineErr; 
            }

            // 4. AI Budget Reconciliation (Phase 20.E.5)
            if (aiBudgetReserved && result.metrics) {
                await aiBudgetGovernanceService.reconcileBudget(
                    job_id, 
                    result.metrics.ai_tokens || 0, 
                    result.metrics.ai_cost || 0
                );
                aiBudgetReserved = false; 
            }

            return {
                job_id,
                status: 'SUCCEEDED',
                engine_result: result,
                wrapper_metadata: {
                    node_id: process.env.NODE_ID || 'localhost',
                    pool: pool,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (err) {
            const failureClass = retryManager.classify(err);
            const strategy = retryManager.getStrategy(failureClass, job.attemptsMade);

            console.error(`[WORKER-FAILURE][${failureClass}] Job ${job_id}: ${err.message}`);
            
            // H3 Hardening: Record Failure Metrics (Phase R13)
            metricsService.recordJobResult(operation, 'FAILED', tId);

            // Log to audit if it's a hard failure or quarantine
            if (strategy.action === 'FAIL' || strategy.quarantine) {
                await this.logFailureAudit(job_id, tId, failureClass, err.message, strategy);
            }

            // Explicitly handle BullMQ retry behavior via strategy if needed
            // For now, we just throw so BullMQ does standard backoff.
            // But if action is 'FAIL', we might want to prevent further retries.
            if (strategy.action === 'FAIL') {
                await job.discard(); // Manual discard for poison pills
            }

            throw err;
        } finally {
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            
            // H2 Hardening: Immediate Resource Cleanup (Phase R13)
            await resourceLifecycleService.cleanupJobResources(data).catch(() => {});

            if (resourceReserved) {
                await resourceGovernanceService.releaseFinish(job_id, tId, governanceContext.queueName).catch(err => {
                    console.error(`[WORKER-ERROR] Failed to release capacity for job ${job_id}: ${err.message}`);
                });
            }

            if (aiBudgetReserved) {
                await aiBudgetGovernanceService.reconcileBudget(job_id, estimatedTokens * 0.1, estimatedCost * 0.1).catch(() => {});
            }
        }
    }

    /**
     * Log failure semantics for operation audit
     */
    async logFailureAudit(jobId, tenantId, failureClass, message, strategy) {
        try {
            const { db } = require('../ppos-shared-infra');
            const sql = `
                INSERT INTO governance_audit (
                    operator_id, operator_role, action_type, target_type, target_id, reason, payload
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            await db.query(sql, [
                'worker-resilience',
                'system',
                'JOB_FAILURE_RECOVERY',
                'job',
                jobId,
                `Failure Class: ${failureClass} | Action: ${strategy.action}`,
                JSON.stringify({ tenantId, message, strategy, timestamp: new Date().toISOString() })
            ]);
        } catch (err) {
            console.error('[AUDIT-ERROR]', err.message);
        }
    }
}

/**
 * Bootstraps the worker for a specific pool (Phase 21.B)
 */
async function bootstrap() {
    const pool = process.env.WORKER_POOL || 'POOL_A';
    const workerImpl = new PreflightWorker();
    const workers = [];

    const poolConfig = {
        'POOL_A': {
            queues: ['preflight-v2', 'autofix-v2'],
            concurrency: parseInt(process.env.POOL_A_CONCURRENCY || '2', 10),
            lockDuration: 60000 * 5 // 5 minutes for heavy jobs
        },
        'POOL_C': {
            queues: ['notifications-v2', 'webhooks-v2', 'batch-orchestrate-v2'],
            concurrency: parseInt(process.env.POOL_C_CONCURRENCY || '20', 10),
            lockDuration: 30000 
        }
    };

    const config = poolConfig[pool] || poolConfig['POOL_A'];
    console.log(`[BOOT] Initializing Worker for ${pool} | Concurrency: ${config.concurrency}`);

    for (const qName of config.queues) {
        console.log(`[BOOT] Listening on Queue: ${qName}`);
        const worker = new Worker(qName, async (job) => {
            return await workerImpl.processJob(job);
        }, {
            connection: sharedQueue.connection,
            concurrency: config.concurrency,
            lockDuration: config.lockDuration
        });

        worker.on('failed', (job, err) => {
            console.error(`[WORKER][${qName}] Job ${job ? job.id : 'unknown'} failed:`, err.message);
        });

        workers.push(worker);
    }

    // H2 Hardening: Janitor sweep for orphaned files (Phase R13)
    const JANITOR_INTERVAL = 10 * 60 * 1000; // 10 minutes
    const janitorId = setInterval(() => {
        resourceLifecycleService.janitorSweep().catch(() => {});
    }, JANITOR_INTERVAL);
    
    // Immediate first sweep
    resourceLifecycleService.janitorSweep().catch(() => {});

    // Graceful Shutdown (Phase 21.B.3)
    const shutdown = async (signal) => {
        console.log(`[SHUTDOWN] Received ${signal}. Stopping workers & janitor...`);
        clearInterval(janitorId);
        await Promise.all(workers.map(w => w.close()));
        console.log('[SHUTDOWN] Workers stopped. Exiting.');
        process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

if (require.main === module) {
    bootstrap().catch(err => {
        console.error('[FATAL-BOOT]', err);
        process.exit(1);
    });
}

module.exports = PreflightWorker;
