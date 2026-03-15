'use strict';

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const SERVICE_URL = process.env.PPOS_PREFLIGHT_SERVICE_URL || 'http://localhost:3000';

/**
 * PdfPipeline (Phase 18.C - Decoupled)
 * 
 * Provides an orchestrating interface for PDF processing via PrintPrice OS Services.
 * Delegating all deterministic execution to the platform layer.
 */

// Mapping of profile names (Legacy support)
function normalizeProfile(p) {
    if (!p) return 'iso_coated_v3';
    const low = p.toLowerCase();
    if (low.includes('fogra51') || low.includes('coated_v3')) return 'iso_coated_v3';
    if (low.includes('fogra52') || low.includes('uncoated_v3')) return 'iso_uncoated_v3';
    return low.replace(/[^a-z0-9_]/g, '_');
}

module.exports = {
    /**
     * Legacy command execution. Now delegating to PPOS Service /analyze.
     */
    async execCmd(cmd, args, opts = {}) {
        console.log(`[PIPELINE][SERVICE-DELEGATION] cmd: ${cmd}`);

        if (cmd === 'gs' && args.includes('pdfwrite')) {
             return { skipped: true, note: 'Redirecting to specialized converters' };
        }

        const filePath = opts.metadata?.filePath || args[args.length - 1];
        if (filePath && fs.existsSync(filePath)) {
            const form = new FormData();
            form.append('file', fs.createReadStream(filePath));
            
            const response = await axios.post(`${SERVICE_URL}/analyze`, form, {
                headers: form.getHeaders(),
                timeout: 30000
            });

            // Return delegated results
            return response.data.data;
        }
        
        throw new Error(`Execution failed: Unsupported command or missing file in decoupled mode.`);
    },

    /**
     * Color Conversion Proxy.
     */
    async gsConvertColor(input, output, profile, opts = {}) {
        const prof = normalizeProfile(profile);
        console.log(`[PIPELINE][SERVICE-DELEGATION] Color Conversion -> ${prof}`);

        const form = new FormData();
        form.append('file', fs.createReadStream(input));

        const response = await axios.post(`${SERVICE_URL}/autofix?fix=color&profile=${prof}`, form, {
            headers: form.getHeaders(),
            responseType: 'arraybuffer',
            timeout: 60000
        });

        await fs.promises.writeFile(output, Buffer.from(response.data));
        return { success: true, output };
    },

    /**
     * Bleed Application Proxy.
     */
    async addBleedCanvasPdf(inputPath, outPath, bleedMm = 3) {
        console.log(`[PIPELINE][SERVICE-DELEGATION] Bleed Application -> ${bleedMm}mm`);

        const form = new FormData();
        form.append('file', fs.createReadStream(inputPath));

        const response = await axios.post(`${SERVICE_URL}/autofix?fix=bleed&bleedMm=${bleedMm}`, form, {
            headers: form.getHeaders(),
            responseType: 'arraybuffer',
            timeout: 60000
        });

        await fs.promises.writeFile(outPath, Buffer.from(response.data));
        return { success: true, outPath };
    },

    // Legacy Stubs for backward compatibility
    normalizeProfile,
    gsFlattenTransparency: async (i, o) => module.exports.gsConvertColor(i, o, 'cmyk', { flatten: true }),
    rebuildAtDpi: async (i, o, dpi = 300) => module.exports.gsConvertColor(i, o, 'cmyk', { dpi })
};
