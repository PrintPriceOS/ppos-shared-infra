// ppos-preflight-worker/subprocess_executor.js
/**
 * Subprocess Executor (Phase 21.C.4)
 * Runs a command in a child process to isolate OOMs and hangs.
 */
const { fork } = require('child_process');
const path = require('path');

class SubprocessExecutor {
    /**
     * Run a command function in a child process
     * @param {string} commandName 'analyze' | 'autofix'
     * @param {object} args { input, config, output }
     * @param {object} options { timeout, memoryLimitMB }
     */
    static async execute(commandName, args, options = {}) {
        const timeout = options.timeout || 120000; // 2m default
        const memoryLimit = options.memoryLimitMB || 2048;

        return new Promise((resolve, reject) => {
            const child = fork(path.join(__dirname, 'subprocess_entry.js'), [], {
                execArgv: [`--max-old-space-size=${memoryLimit}`],
                env: { ...process.env, SUBPROCESS_MODE: 'true' }
            });

            const timer = setTimeout(() => {
                child.kill('SIGKILL');
                reject(new Error(`SUBPROCESS_TIMEOUT: Command ${commandName} exceeded ${timeout}ms`));
            }, timeout);

            child.on('message', (message) => {
                clearTimeout(timer);
                if (message.error) {
                    reject(new Error(message.error));
                } else {
                    resolve(message.result);
                }
                child.kill();
            });

            child.on('error', (err) => {
                clearTimeout(timer);
                reject(err);
            });

            child.on('exit', (code, signal) => {
                clearTimeout(timer);
                if (code !== 0 && signal !== 'SIGKILL') {
                    reject(new Error(`SUBPROCESS_CRASH: Child exited with code ${code} signal ${signal}`));
                }
            });

            // Send task to child
            child.send({ commandName, args });
        });
    }
}

module.exports = SubprocessExecutor;
