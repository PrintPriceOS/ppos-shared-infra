/**
 * ReportEnricher
 * 
 * Internal service for mapping technical IDs to platform registry metadata.
 * Classification: PLATFORM_ENRICHMENT
 */
const registryAdapter = require('../registryAdapter');

class ReportEnricher {
    constructor() {
        try {
            this.registry = registryAdapter.getIssueRegistry();
        } catch (err) {
            console.error('[REPORT-ENRICHER] Failed to load registry:', err.message);
            this.registry = {};
        }
    }

    /**
     * Enriches raw findings with platform metadata (titles, messages, fits).
     */
    enrich(report, engines = {}) {
        const enrichedFindings = report.findings.map(raw => {
            const regEntry = this.registry[raw.id];

            if (regEntry) {
                return {
                    id: raw.id,
                    title: regEntry.title,
                    type: regEntry.type,
                    severity: raw.severity || regEntry.severity,
                    confidence: raw.confidence,
                    user_message: regEntry.user_message,
                    evidence: raw.evidence,
                    tags: regEntry.tags || [],
                    fix: {
                        available: !!regEntry.fix,
                        applied: false,
                        step: regEntry.fix
                    }
                };
            } else {
                // Fallback for unregistered findings
                return {
                    id: raw.id,
                    title: raw.id,
                    type: 'unknown',
                    severity: raw.severity || 'warning',
                    confidence: raw.confidence || 0.5,
                    user_message: 'Unhandled preflight finding.',
                    evidence: raw.evidence
                };
            }
        });

        // Add platform metadata and engine versions
        return {
            ...report,
            findings: enrichedFindings,
            engines: {
                client_engine_version: engines.client || 'v2-stub',
                server_engine_version: engines.server || `v2-deterministic-${process.env.GIT_COMMIT?.slice(0, 7) || '1.0'}`,
                policy_version: process.env.PPP_POLICY_VERSION || '2026-03'
            }
        };
    }
}

module.exports = new ReportEnricher();
