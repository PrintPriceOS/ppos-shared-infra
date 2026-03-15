// ppos-preflight-worker/subprocess_manager.js
/**
 * Optimized Subprocess Manager (Phase 22.C)
 * Reduces cold-start latency by maintaining a pool of warm child processes.
 */
const { fork } = require('child_process');
const path = require('path');
const { featureFlagService } = require('../ppos-shared-infra');

class SubprocessManager {
    constructor(options = {}) {
        this.workerPath = path.join(__dirname, 'subprocess_entry.js');
        this.poolSize = options.poolSize || 2;
        this.memoryLimit = options.memoryLimitMB || 1536;
        this.warmPool = [];
        this.activeCount = 0;
        this.allWorkers = new Set(); // Track all workers for the death pact

        // Register Death Pact
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
    }

    shutdown() {
        console.log(`[SUBPROCESS-MANAGER] Shutting down. Killing ${this.allWorkers.size} workers...`);
        for (const child of this.allWorkers) {
            try { child.kill('SIGKILL'); } catch (e) {}
        }
        this.allWorkers.clear();
        this.warmPool = [];
    }

    async _refillPool() {
        if (!(await featureFlagService.isEnabled('WARM_POOL_ENABLED'))) {
            return;
        }

        while (this.warmPool.length + this.activeCount < this.poolSize) {
            console.log('[SUBPROCESS-MANAGER] Pre-warming new child process...');
            const child = fork(this.workerPath, [], {
                execArgv: [`--max-old-space-size=${this.memoryLimit}`],
                env: { ...process.env, SUBPROCESS_MODE: 'true' }
            });
            this.allWorkers.add(child);
            
            // Mark as warm once ready (could add a handshake message if needed)
            this.warmPool.push({
                child,
                runs: 0,
                createdAt: Date.now()
            });
        }
    }

    async execute(commandName, args, options = {}) {
        const timeout = options.timeout || 180000;
        
        // 1. Get a warm worker from the pool
        const isWarmEnabled = await featureFlagService.isEnabled('WARM_POOL_ENABLED');
        let worker = isWarmEnabled ? this.warmPool.shift() : null;
        
        // 2. Fallback: if pool is empty (high burst), create one on-demand
        if (!worker) {
            console.warn('[SUBPROCESS-MANAGER] Pool exhausted, creating on-demand worker');
            const child = fork(this.workerPath, [], {
                execArgv: [`--max-old-space-size=${this.memoryLimit}`],
                env: { ...process.env, SUBPROCESS_MODE: 'true' }
            });
            this.allWorkers.add(child);
            worker = { child, runs: 0, createdAt: Date.now() };
        }

        this.activeCount++;

        try {
            const result = await this._runInWorker(worker, commandName, args, timeout);
            
            // 3. Post-execution health check
            worker.runs++;
            const tooOld = (Date.now() - worker.createdAt) > 3600000; // 1 hour
            const tooManyRuns = worker.runs >= 50; // Periodic recycle to prevent slow leaks
            
            if (tooOld || tooManyRuns) {
                console.log(`[SUBPROCESS-MANAGER] Retiring worker (Runs: ${worker.runs})`);
                worker.child.kill();
                this.allWorkers.delete(worker.child);
            } else {
                this.warmPool.push(worker);
            }

            return result;
        } catch (err) {
            // Kill failing worker to ensure clean state
            worker.child.kill();
            this.allWorkers.delete(worker.child);
            throw err;
        } finally {
            this.activeCount--;
            await this._refillPool();
        }
    }

    _runInWorker(worker, commandName, args, timeout) {
        return new Promise((resolve, reject) => {
            const child = worker.child;
            
            const timer = setTimeout(() => {
                child.removeAllListeners();
                child.kill('SIGKILL');
                this.allWorkers.delete(child);
                reject(new Error(`SUBPROCESS_TIMEOUT: ${commandName} exceeded ${timeout}ms`));
            }, timeout);

            const onMessage = (message) => {
                clearTimeout(timer);
                child.removeListener('message', onMessage);
                child.removeListener('error', onError);
                if (message.error) {
                    reject(new Error(message.error));
                } else {
                    resolve(message.result);
                }
            };

            const onError = (err) => {
                clearTimeout(timer);
                child.removeListener('message', onMessage);
                child.removeListener('error', onError);
                reject(err);
            };

            child.on('message', onMessage);
            child.on('error', onError);

            child.send({ commandName, args });
        });
    }
}

// Singleton for the worker process
module.exports = new SubprocessManager();
