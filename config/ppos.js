/**
 * PrintPrice OS (PPOS) Integration Configuration
 * 
 * Centralizes all environment variables and defaults for 
 * communicating with the PPOS runtime.
 */

const pposConfig = {
    // Endpoints
    preflightServiceUrl: process.env.PPOS_PREFLIGHT_SERVICE_URL || 'http://localhost:3000',
    controlPlaneUrl: process.env.PPOS_CONTROL_PLANE_URL || 'http://localhost:8080',
    
    // Performance & Lifecycle
    timeoutMs: parseInt(process.env.PPOS_REQUEST_TIMEOUT_MS, 10) || 30000,
    longTimeoutMs: parseInt(process.env.PPOS_LONG_REQUEST_TIMEOUT_MS, 10) || 60000,
    
    // Feature Flags
    enableAsyncPreflight: process.env.PPOS_ENABLE_ASYNC_PREFLIGHT === 'true',
    enableAutofix: process.env.PPOS_ENABLE_AUTOFIX !== 'false', // Default true
    
    // Security
    apiKey: process.env.PPOS_API_KEY || null,
    
    // Environment Context
    environment: process.env.PPOS_ENVIRONMENT || process.env.NODE_ENV || 'development',
    
    // Internal Routing
    routes: {
        analyze: '/preflight/analyze',
        autofix: '/preflight/autofix',
        status: (jobId) => `/preflight/status/${jobId}`,
        health: '/health'
    }
};

/**
 * Validates the current configuration for production readiness.
 * @returns {Array} List of warnings/errors
 */
function validateConfig() {
    const issues = [];
    if (pposConfig.environment === 'production') {
        if (pposConfig.preflightServiceUrl.includes('localhost')) {
            issues.push('WARNING: PPOS_PREFLIGHT_SERVICE_URL points to localhost in production.');
        }
        if (!pposConfig.apiKey && pposConfig.environment === 'production') {
            issues.push('NOTE: No PPOS_API_KEY defined for production environment.');
        }
    }
    return issues;
}

module.exports = {
    ...pposConfig,
    validateConfig
};
