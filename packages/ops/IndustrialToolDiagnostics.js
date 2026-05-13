const { execSync } = require('child_process');
const fs = require('fs');

/**
 * IndustrialToolDiagnostics
 * Ensures permanent production availability of industrial tools for PDF diagnosis.
 * Prevents IND_INTEGRITY_MISSING_TOOL and IND_INTEGRITY_EXTRACTION_ERROR.
 */
class IndustrialToolDiagnostics {
    /**
     * Executes industrial-grade verification of all required PDF extraction and diagnostic tools.
     * Fails loud if any tool is missing. No silent fallbacks.
     * @returns {Object} report object mapping tool names to status strings
     */
    static runDiagnostics() {
        const tools = [
            { name: 'pdfinfo', cmd: 'which pdfinfo' },
            { name: 'pdfimages', cmd: 'which pdfimages' },
            { name: 'mutool', cmd: 'which mutool' },
            { name: 'ghostscript', cmd: 'gs --version' }
        ];

        const report = {};
        let missingAny = false;

        for (const tool of tools) {
            try {
                // Verify binary execution / path availability
                execSync(tool.cmd, { stdio: 'ignore' });
                report[tool.name] = 'OK';
            } catch (err) {
                report[tool.name] = 'MISSING';
                missingAny = true;
            }
        }

        // Print output exactly matching the canonical production contract
        console.log('[INDUSTRIAL-TOOLS]');
        console.log(`pdfinfo=${report.pdfinfo}`);
        console.log(`pdfimages=${report.pdfimages}`);
        console.log(`mutool=${report.mutool}`);
        console.log(`ghostscript=${report.ghostscript}`);

        if (missingAny) {
            console.error('[INDUSTRIAL-TOOLS-ERROR] Critical failure: Mandatory PDF diagnosis tools are missing from the container environment.');
            console.error('[INDUSTRIAL-TOOLS-ERROR] Triggering IND_INTEGRITY_MISSING_TOOL / IND_INTEGRITY_EXTRACTION_ERROR.');
            console.error('[INDUSTRIAL-TOOLS-ERROR] Refusing to mark analysis as production-ready.');
            
            // Fail loud: throw error to halt startup/healthcheck instantly
            const error = new Error('IND_INTEGRITY_MISSING_TOOL: Production environment lacks mandatory industrial tools (pdfinfo, pdfimages, mutool, ghostscript). Analysis marked as DEGRADED.');
            error.code = 'IND_INTEGRITY_MISSING_TOOL';
            error.analysis_type = 'DEGRADED';
            throw error;
        }

        return report;
    }
}

module.exports = IndustrialToolDiagnostics;
