// ppos-shared-infra/packages/resilience/RetryManager.js

/**
 * RetryManager (Phase 21.C.2)
 * Classifies failures and determines retry strategies according to the platform matrix.
 */
class RetryManager {
    /**
     * Error classification rules
     */
    static classify(error) {
        const msg = (error.message || '').toLowerCase();
        const code = error.code || '';

        // 1. Policy & Budget (No automatic retry in standard worker loop)
        if (msg.includes('policy') || msg.includes('suspended')) return 'POLICY_BLOCKED';
        if (msg.includes('budget') || msg.includes('quota')) return 'BUDGET_BLOCKED';

        // 2. Input Integrity
        if (msg.includes('corrupt') || msg.includes('invalid pdf') || msg.includes('checksum')) return 'INPUT_INVALID';

        // 3. Resource Exhaustion
        if (msg.includes('oom') || msg.includes('memory') || msg.includes('allocation failed')) return 'OOM_RISK';
        if (msg.includes('timeout') || code === 'ETIMEDOUT') {
            if (msg.includes('worker-primary')) return 'TIMEOUT_HARD';
            return 'TRANSIENT';
        }

        // 4. Dependency Failures
        if (msg.includes('circuit breaker open')) return 'DEPENDENCY_UNAVAILABLE';
        if (msg.includes('429') || msg.includes('rate limit')) return 'EXTERNAL_RATE_LIMITED';
        
        // 5. General Transients
        if (code === 'ECONNREFUSED' || code === 'ECONNRESET' || code === 'EPIPE' || msg.includes('network error')) {
            return 'TRANSIENT';
        }

        return 'RUNTIME_FAILURE';
    }

    /**
     * Get the recovery strategy for a specific class
     */
    static getStrategy(failureClass, retryCount = 0) {
        switch (failureClass) {
            case 'TRANSIENT':
                return {
                    action: 'RETRY',
                    delay: Math.min(1000 * Math.pow(2, retryCount) + (Math.random() * 500), 60000),
                    quarantine: null
                };

            case 'EXTERNAL_RATE_LIMITED':
                return {
                    action: 'RETRY',
                    delay: 5000 * (retryCount + 1), // Linear backoff for rate limits
                    quarantine: 'external_dlq'
                };

            case 'BUDGET_BLOCKED':
                return {
                    action: 'DELAY',
                    delay: 60000, // Check next minute
                    quarantine: 'resource_quarantine'
                };

            case 'POLICY_BLOCKED':
            case 'INPUT_INVALID':
                return {
                    action: 'FAIL',
                    delay: 0,
                    quarantine: failureClass === 'INPUT_INVALID' ? 'input_poison' : 'policy_quarantine'
                };

            case 'OOM_RISK':
                return {
                    action: 'FAIL',
                    delay: 0,
                    quarantine: 'resource_quarantine',
                    instruction: 'REROUTE_TO_ISOLATED_POOL'
                };

            case 'DEPENDENCY_UNAVAILABLE':
                return {
                    action: 'RETRY',
                    delay: 30000, // Slower retry for downed dependencies
                    quarantine: 'runtime_failure'
                };

            default:
                return {
                    action: retryCount < 2 ? 'RETRY' : 'FAIL',
                    delay: 5000,
                    quarantine: 'runtime_failure'
                };
        }
    }
}

module.exports = RetryManager;
