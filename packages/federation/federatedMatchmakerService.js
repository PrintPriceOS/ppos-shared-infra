// ppos-shared-infra/packages/federation/federatedMatchmakerService.js
const db = require('../data/db');
const PrinterRegistryService = require('./printerRegistryService');

/**
 * FederatedMatchmakerService (Phase 23.C)
 * Filters and scores printer nodes for job routing.
 */
class FederatedMatchmakerService {
    /**
     * Weights for scoring engine
     */
    static get SCORING_WEIGHTS() {
        return {
            availability: 300,  // Max 300 points
            reliability: 250,   // Max 250 points
            sla: 200,           // Max 200 points
            trust: 150,         // Max 150 points
            proximity: 100      // Max 100 points
        };
    }

    /**
     * Find best candidates for a job
     * @param {Object} jobSpec Includes requirements (format, paper, binding, etc.)
     */
    static async findBestCandidates(jobSpec) {
        // 1. Resolve Technical Requirements
        const requirements = this._extractRequirements(jobSpec);

        // 2. STAGE 1: Hard Filters (Capability Match)
        const candidates = await PrinterRegistryService.findPrintersByCapabilities(requirements);
        
        if (candidates.length === 0) return [];

        // 3. STAGE 2: Scoring Engine
        const scored = await Promise.all(
            candidates.map(async printer => await this._scorePrinter(printer, jobSpec))
        );

        // 4. Sort by Final Score DESC
        return scored.sort((a, b) => b.finalScore - a.finalScore);
    }

    /**
     * Internal scoring logic
     */
    static async _scorePrinter(printer, jobSpec) {
        const weights = this.SCORING_WEIGHTS;
        const runtime = await this._getPrinterRuntime(printer.id);

        // 1. Availability Score (based on queue depth and availability state)
        let availScore = weights.availability;
        if (runtime.availability_state !== 'available') availScore -= 200;
        availScore -= Math.min(runtime.queue_depth * 10, 150);

        // 2. Reliability Score
        let reliScore = (runtime.acceptance_rate_24h || 0) * (weights.reliability / 100);

        // 3. SLA & Trust Score
        let slaScore = 0;
        if (printer.sla_tier === 'critical') slaScore = weights.sla;
        else if (printer.sla_tier === 'high') slaScore = weights.sla * 0.7;
        else slaScore = weights.sla * 0.4;

        let trustScore = 0;
        if (printer.trust_level === 'partner') trustScore = weights.trust;
        else if (printer.trust_level === 'verified') trustScore = weights.trust * 0.6;

        // 4. Proximity (Simplified for v1)
        let proxScore = 0;
        if (jobSpec.deliveryCountry === printer.country_code) proxScore = weights.proximity;

        const finalScore = availScore + reliScore + slaScore + trustScore + proxScore;

        return {
            printerId: printer.id,
            printerCode: printer.printer_code,
            displayName: printer.display_name,
            finalScore,
            trace: {
                availability: availScore,
                reliability: reliScore,
                sla: slaScore,
                trust: trustScore,
                proximity: proxScore
            }
        };
    }

    static _extractRequirements(jobSpec) {
        // Map common job spec fields to capability taxonomy
        const reqs = [];
        if (jobSpec.format) reqs.push({ type: 'format', key: 'standard_size', value: jobSpec.format });
        if (jobSpec.binding) reqs.push({ type: 'finishing', key: 'binding_type', value: jobSpec.binding });
        if (jobSpec.colorMode) reqs.push({ type: 'print', key: 'color_mode', value: jobSpec.colorMode });
        return reqs;
    }

    static async _getPrinterRuntime(printerId) {
        const { rows } = await db.query('SELECT * FROM printer_runtime_status WHERE printer_id = ?', [printerId]);
        return rows[0] || {};
    }
}

module.exports = FederatedMatchmakerService;
