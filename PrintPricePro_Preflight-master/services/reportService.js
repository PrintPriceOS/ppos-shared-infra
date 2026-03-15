const reportCore = require('./internal/reportCore');
const reportEnricher = require('./internal/reportEnricher');
const reportAdapter = require('./internal/reportTelemetryAdapter');

class ReportService {
    /**
     * Builds a full V2 report by orchestrating Core, Enricher, and Adapter.
     */
    buildReport(asset, analysisResults, policyObj, engines = {}) {
        // 1. Technical Core Construction
        const rawReport = reportCore.buildRawReport(asset, analysisResults, policyObj);

        // 2. Sanitize Evidence (Boundary Logic)
        rawReport.findings.forEach(f => {
            f.evidence = reportAdapter.sanitizeEvidence(f.evidence);
        });

        // 3. Platform Enrichment
        const enrichedReport = reportEnricher.enrich(rawReport, engines);

        // 4. Boundary Validation (SCHEMA V2)
        // Note: For backward compatibility, we map industrial_risk_score to risk_score
        enrichedReport.risk_score = rawReport.industrial_risk_score;

        reportAdapter.validate(enrichedReport);

        return enrichedReport;
    }

    /**
     * Compatibility helper for legacy risk score calls.
     */
    calculateRiskScore(findings) {
        return reportCore.calculateRiskScore(findings);
    }

    /**
     * Compatibility helper for legacy sanitization.
     */
    sanitizeEvidence(evidence) {
        return reportAdapter.sanitizeEvidence(evidence);
    }

    /**
     * Prunes a report for public consumption.
     */
    pruneForPublic(report) {
        const publicReport = { ...report };
        delete publicReport.telemetry;
        return publicReport;
    }
}

module.exports = new ReportService();
