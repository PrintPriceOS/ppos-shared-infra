const regionContext = require('../../ppos-shared-infra/packages/region/RegionContext');
const { redactPaths } = require('../../ppos-shared-infra/packages/region/sanitizationUtils');
const regionFilter = require('../../ppos-shared-infra/packages/region/RegionFilter');

class WorkerSanitizer {
    /**
     * Sanitizes an error for external persistence or reporting.
     */
    sanitizeError(error) {
        if (!error) return null;

        const ctx = regionContext.get();
        const baseError = {
            code: error.code || 'WORKER_RUNTIME_ERROR',
            message: redactPaths(error.message),
            failure_category: error.category || 'general',
            region_id: ctx.region_id,
            timestamp: new Date().toISOString(),
            sanitized: true
        };

        return baseError;
    }

    /**
     * Sanitizes audit payloads before DB storage.
     */
    sanitizeAuditPayload(payload) {
        const sanitized = { ...payload };

        if (sanitized.message) {
            sanitized.message = redactPaths(sanitized.message);
        }

        // Redact common sensitive keys from shared infra rules
        return regionFilter.sanitizeForGlobalSync('audit_event', sanitized);
    }

    /**
     * Sanitizes quarantine metadata.
     */
    sanitizeQuarantineMetadata(jobId, strategy) {
        const ctx = regionContext.get();
        return {
            job_id: jobId,
            region_id: ctx.region_id,
            action: strategy.action,
            quarantine_label: strategy.quarantine,
            instruction: strategy.instruction || 'NONE',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Redacts log objects.
     */
    sanitizeLog(obj) {
        try {
            const str = JSON.stringify(obj);
            const redacted = redactPaths(str);
            return JSON.parse(redacted);
        } catch (e) {
            return { error: 'LOG_SERIALIZATION_FAILED' };
        }
    }
}

module.exports = new WorkerSanitizer();
