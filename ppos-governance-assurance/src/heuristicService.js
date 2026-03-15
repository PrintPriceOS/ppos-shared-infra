class HeuristicService {
    /**
     * Phase 18.C: Image heuristics are now primarily handled by PPOS during /analyze.
     * This local stub remains for any product-side post-processing of results.
     */
    async getImageHeuristics(filePath) {
        // In a fully decoupled model, this is no longer called locally for file probing.
        // Results are fetched from the PPOS report instead.
        return { totalImages: 0, findings: [], delegated: true };
    }

    /**
     * Determines the "Edition Intent" based on document geometry and metadata.
     */
    classifyEditionIntent(info) {
        const signals = [];
        const pages = info.pages || 0;

        // Signal: Book/Long-form
        if (pages >= 48) {
            signals.push({
                id: 'long-form-intent',
                title: 'Book/Catalog detected',
                confidence: 0.9,
                user_message: "This document has a high page count, typical of books or catalogs."
            });
        } else if (pages >= 4 && pages % 4 === 0) {
            signals.push({
                id: 'brochure-intent',
                title: 'Brochure layout detected',
                confidence: 0.7,
                user_message: "Page count is a multiple of 4, suggestive of a folded brochure or booklet."
            });
        }

        return signals;
    }

    /**
     * Detects if text has been converted to outlines (paths).
     * Heuristic: High page complexity + Very low font count.
     */
    detectVectorTextRisk(info, fonts) {
        if (info.pages > 0 && fonts.length === 0) {
            // Document has pages but NO fonts. Likely vector-only or text-to-outlines.
            return [{
                id: 'text-outline-risk',
                severity: 'info',
                details: "No fonts detected. The text might be converted to outlines, which limits searchability and last-minute edits."
            }];
        }
        return [];
    }
}

module.exports = new HeuristicService();
