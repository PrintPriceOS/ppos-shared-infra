/**
 * AutofixRegistry
 * 
 * Maps Technical Finding IDs to technical fix methods in PdfFixEngine.
 * Classification: FIX_REGISTRY
 */
const registryAdapter = require('../registryAdapter');

class AutofixRegistry {
    constructor() {
        this.methodMap = {
            'COLOR_MISMATCH': 'applyCmyk',
            'MISSING_BLEED': 'applyBleed',
            'LOW_RESOLUTION': null, // No fix available yet
            'TRANSPARENCY_PRESENT': null // Handled via GS pipeline
        };
    }

    /**
     * Resolves a technical finding to a fix method name.
     */
    getFixMethod(findingId) {
        // First check internal override map
        if (this.methodMap[findingId]) return this.methodMap[findingId];

        // Fallback to registry metadata if available
        const registryEntry = registryAdapter.getIssueRegistry()[findingId];
        if (registryEntry?.availableFix === 'CONVERT_CMYK') return 'applyCmyk';
        if (registryEntry?.availableFix === 'ADD_BLEED') return 'applyBleed';

        return null;
    }

    /**
     * Determines if a finding is technically fixable.
     */
    isFixable(findingId) {
        return !!this.getFixMethod(findingId);
    }
}

module.exports = new AutofixRegistry();
