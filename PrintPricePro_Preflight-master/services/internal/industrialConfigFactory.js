/**
 * IndustrialConfigFactory
 * 
 * Composition layer responsible for reading thresholds and rules from the platform registry
 * and preparing them for injection into pure industrial kernel modules.
 * Classification: BOUNDARY_ADAPTER (Platform -> Product Kernel)
 */
const registryAdapter = require('../registryAdapter');

class IndustrialConfigFactory {
    /**
     * Composes binding rules for SpineCalculator.
     */
    getSpineRules() {
        return registryAdapter.getBindingRules();
    }

    /**
     * Composes geometry thresholds for GeometryAuditEngine.
     */
    getGeometryThresholds() {
        const productRegistry = registryAdapter.getProductRegistry() || {};
        // Provide defaults if registry is empty (Preflight Engine Standards)
        return {
            minBleedMm: productRegistry.min_bleed_mm || 3.0,
            safeAreaMm: productRegistry.safe_area_mm || 5.0,
            standardSpinePerSheetMm: productRegistry.spine_step_mm || 0.1
        };
    }
}

module.exports = new IndustrialConfigFactory();
