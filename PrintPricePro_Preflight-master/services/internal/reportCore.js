/**
 * ReportCoreBuilder
 * 
 * Internal service for building raw technical preflight reports.
 * Classification: PRODUCT_RUNTIME
 */

// Note: policyEngine is assumed to be global or available via require
// In this monolith, it appears to be used as a global or from a nearby service.
// Let's assume we need to require it if we want to be clean.
const policyEngine = require('../../../ppos-governance-assurance/src/policyEngine');

class ReportCoreBuilder {
    /**
     * Builds a raw report containing only technical findings and industrial metadata.
     */
    buildRawReport(asset, analysisResults, policyObj) {
        const { info } = analysisResults;

        // 1. Evaluate technical rules (Industrial context)
        const rawFindings = policyEngine.evaluateTechnicalRules(analysisResults, policyObj);

        // 2. Build the structural core
        const report = {
            document: {
                fileName: asset.filename,
                fileSize: asset.size,
                pageCount: info.pages || 0,
                pdfVersion: info.pdfVersion || 'unknown'
            },
            findings: rawFindings.map(f => ({
                id: f.id,
                severity: f.severity || 'warning',
                confidence: f.confidence || 1.0,
                evidence: f.evidence || {}
            })),
            industrial_risk_score: this.calculateRiskScore(rawFindings)
        };

        return report;
    }

    /**
     * Calculates an industrial risk score based on finding severity.
     */
    calculateRiskScore(findings = []) {
        let score = 0;
        findings.forEach(f => {
            const severity = (f.severity || '').toUpperCase();
            if (severity === 'CRITICAL' || severity === 'ERROR') score += 30;
            else if (severity === 'WARNING') score += 10;
            else if (severity === 'INFO') score += 2;
        });
        return Math.min(100, score);
    }
}

module.exports = new ReportCoreBuilder();
