/**
 * ReportTelemetryAdapter
 * 
 * Handles evidence sanitization and schema validation for reporting.
 * Classification: BOUNDARY_ADAPTER
 */
const ErrorTaxonomy = require('../errorTaxonomy');

class ReportTelemetryAdapter {
    /**
     * Redacts server paths and truncates long details.
     */
    sanitizeEvidence(evidence) {
        if (!evidence || !evidence.details) return evidence;

        const safe = { ...evidence };
        let str = safe.details;

        if (typeof str === 'string') {
            str = str.replace(/[A-Z]:\\[^\s"'\n]+/gi, '[REDACTED_SECURE_TENANT_PATH]');
            str = str.replace(/(?:\/(?:var|usr|etc|opt|home|tmp)\/)[^\s"'\n]+/gi, '[REDACTED_SECURE_TENANT_PATH]');

            const MAX_LEN = 10000;
            if (str.length > MAX_LEN) {
                str = str.substring(0, MAX_LEN) + '\n\n... [TRUNCATED: Full log available via Audit Log API]';
            }
            safe.details = str;
        }
        return safe;
    }

    /**
     * Validates the report against the final boundary contract.
     */
    validate(report) {
        const required = ['document', 'findings', 'industrial_risk_score', 'engines'];
        for (const field of required) {
            if (report[field] === undefined) {
                const err = new Error(`[REPORT-ADAPTER] Contract violation: Missing ${field}`);
                err.code = ErrorTaxonomy.REPORT_SCHEMA_VALIDATION_FAILED;
                throw err;
            }
        }
        return true;
    }
}

module.exports = new ReportTelemetryAdapter();
