// ppos-shared-infra/packages/ops/SecretManager.js
const fs = require('fs');
const path = require('path');

/**
 * SecretManager (Phase R13 - H1)
 * Decouples code from .env by providing a unified secret resolution layer.
 * Supports Docker Secrets and Environment Variables.
 */
class SecretManager {
    /**
     * Get a secret by key
     * @param {string} key 
     * @param {any} defaultValue 
     * @returns {string}
     */
    static get(key, defaultValue = null) {
        // 1. Try Docker Secret (Industrial Grade)
        const dockerSecretPath = `/run/secrets/${key}`;
        try {
            if (fs.existsSync(dockerSecretPath)) {
                return fs.readFileSync(dockerSecretPath, 'utf8').trim();
            }
        } catch (err) {
            // Silently fail and move to ENV
        }

        // 2. Try Environment Variable (SECRET_ prefix creates a harden boundary)
        const secretKey = `SECRET_${key.toUpperCase()}`;
        if (process.env[secretKey]) {
             return process.env[secretKey];
        }

        // 3. Fallback to standard ENV (Legacy / Development)
        if (process.env[key]) {
             return process.env[key];
        }

        return defaultValue;
    }

    /**
     * Resolves a map of required secrets
     * @param {string[]} keys 
     * @returns {Object}
     */
    static resolveMap(keys) {
        const result = {};
        for (const key of keys) {
            result[key] = this.get(key);
        }
        return result;
    }
    
    /**
     * Validates presence of critical secrets
     * @param {string[]} requiredKeys 
     */
    static validate(requiredKeys) {
        const missing = requiredKeys.filter(k => !this.get(k));
        if (missing.length > 0) {
            throw new Error(`[SECRET-HARDENING] Missing critical secrets: ${missing.join(', ')}`);
        }
    }
}

module.exports = SecretManager;
