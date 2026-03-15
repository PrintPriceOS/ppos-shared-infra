/**
 * AutofixService
 * 
 * Orchestrating entry point for PDF fixes.
 * Classification: TRANSITIONAL_HYBRID
 */
const pdfPipeline = require('./pdfPipeline');

module.exports = {
    /**
     * Delegates CMYK conversion to the PPOS-backed pipeline.
     */
    async convertCmyk(input, output, profile) {
        return pdfPipeline.gsConvertColor(input, output, profile);
    },

    /**
     * Delegates Bleed addition to the PPOS-backed pipeline.
     */
    async addBleed(input, output, bleedMm) {
        return pdfPipeline.addBleedCanvasPdf(input, output, bleedMm);
    },

    /**
     * New Strategic Entry Point: Executes full fix lifecycle.
     */
    async executeFixChain(asset, policyObj, jobContext) {
        return coordinator.executeFixChain(asset, policyObj, jobContext);
    }
};
