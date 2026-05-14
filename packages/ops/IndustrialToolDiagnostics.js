const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
            { name: 'pdfinfo', cmd: 'which pdfinfo', verCmd: 'pdfinfo -v 2>&1 | head -n 1' },
            { name: 'pdfimages', cmd: 'which pdfimages', verCmd: 'pdfimages -v 2>&1 | head -n 1' },
            { name: 'mutool', cmd: 'which mutool', verCmd: 'mutool -v 2>&1 | head -n 1' },
            { name: 'ghostscript', cmd: 'gs --version', verCmd: 'gs --version' },
            { name: 'qpdf', cmd: 'which qpdf', verCmd: 'qpdf --version 2>&1 | head -n 1' },
            { name: 'file', cmd: 'which file', verCmd: 'file --version 2>&1 | head -n 1' }
        ];

        const report = {};
        const versions = {};
        let missingAny = false;

        for (const tool of tools) {
            try {
                // Verify binary execution / path availability
                execSync(tool.cmd, { stdio: 'ignore' });
                report[tool.name] = 'OK';
                try {
                    const v = execSync(tool.verCmd).toString().trim();
                    versions[tool.name] = v || 'unknown';
                } catch (e) {
                    versions[tool.name] = 'unknown';
                }
            } catch (err) {
                report[tool.name] = 'MISSING';
                versions[tool.name] = 'none';
                missingAny = true;
            }
        }

        // Verify storage writability parity
        const storageDirs = [
            process.env.PPOS_STORAGE_BASE || '/tmp/ppos-preflight',
            process.env.PPOS_TEMP_DIR || '/tmp/ppos-preflight'
        ];
        let storageStatus = 'OK';
        for (const dir of [...new Set(storageDirs)]) {
            try {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                const testFile = path.join(dir, `.probe_${Date.now()}`);
                fs.writeFileSync(testFile, 'ok');
                fs.unlinkSync(testFile);
            } catch (e) {
                storageStatus = `FAILED (${e.message})`;
                console.warn(`[INDUSTRIAL-STORAGE-WARNING] Writable check failed on ${dir}: ${e.message}`);
            }
        }

        // Verify primary ICC Profile path availability
        const iccCandidate = process.env.PPOS_ICC_PROFILE_PATH || '/app/icc-profiles/PSO_Coated_v3.icc';
        const cmykCandidate = process.env.PPOS_CMYK_PROFILE_PATH || '/app/icc-profiles/PSO_Coated_v3.icc';
        const iccStatus = fs.existsSync(iccCandidate) ? 'PRESENT' : 'MISSING_OR_UNMOUNTED';
        const cmykStatus = fs.existsSync(cmykCandidate) ? 'PRESENT' : 'MISSING_OR_UNMOUNTED';

        // Rejection check: verify no host path contamination is present in runtime container env
        let envClean = true;
        for (const [key, val] of Object.entries(process.env)) {
            if (val && typeof val === 'string' && val.includes('/opt/printprice-os')) {
                console.warn(`[INDUSTRIAL-ENV-WARNING] Found contaminated host path in process.env.${key}=${val}`);
                envClean = false;
            }
        }

        // Print output exactly matching the canonical production contract
        console.log('[INDUSTRIAL-TOOLS]');
        console.log(`pdfinfo=${report.pdfinfo} (${versions.pdfinfo})`);
        console.log(`pdfimages=${report.pdfimages} (${versions.pdfimages})`);
        console.log(`mutool=${report.mutool} (${versions.mutool})`);
        console.log(`ghostscript=${report.ghostscript} (${versions.ghostscript})`);
        console.log(`qpdf=${report.qpdf} (${versions.qpdf})`);
        console.log(`file=${report.file} (${versions.file})`);
        console.log(`storage_writability=${storageStatus}`);
        console.log(`icc_profile_access=${iccStatus}`);
        console.log(`cmyk_profile_access=${cmykStatus}`);
        console.log(`container_env_clean=${envClean ? 'OK' : 'CONTAMINATED'}`);

        if (missingAny) {
            console.error('[INDUSTRIAL-TOOLS-ERROR] Critical failure: Mandatory PDF diagnosis tools are missing from the container environment.');
            console.error('[INDUSTRIAL-TOOLS-ERROR] Triggering IND_INTEGRITY_MISSING_TOOL / IND_INTEGRITY_EXTRACTION_ERROR.');
            console.error('[INDUSTRIAL-TOOLS-ERROR] Refusing to mark analysis as production-ready.');
            
            // Fail loud: throw error to halt startup/healthcheck instantly
            const error = new Error('IND_INTEGRITY_MISSING_TOOL: Production environment lacks mandatory industrial tools (pdfinfo, pdfimages, mutool, ghostscript, qpdf, file). Analysis marked as DEGRADED.');
            error.code = 'IND_INTEGRITY_MISSING_TOOL';
            error.analysis_type = 'DEGRADED';
            throw error;
        }

        return { report, versions, storageStatus, iccStatus, cmykStatus, envClean };
    }
}

module.exports = IndustrialToolDiagnostics;
