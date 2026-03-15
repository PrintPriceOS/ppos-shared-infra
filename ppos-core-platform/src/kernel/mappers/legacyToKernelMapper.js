/**
 * @project PrintPrice Pro - Platform Kernel
 */
const JobSpec = require('../domain/jobSpec');
const Finding = require('../domain/finding');

/**
 * Legacy to Kernel Mapper
 * Responsibility: Bridge older structures into canonical kernel objects.
 */
class LegacyToKernelMapper {
    /**
     * Maps an old report finding to a hardened Finding object.
     * @param {object} legacyFinding 
     */
    mapFinding(legacyFinding) {
        if (!legacyFinding) return null;

        return new Finding({
            code: legacyFinding.id || legacyFinding.code,
            severity: legacyFinding.severity,
            status: legacyFinding.status || "ready",
            category: legacyFinding.tags?.[0] || legacyFinding.category || "preflight",
            sourceEngine: legacyFinding.source || "legacy_preflight",
            message: legacyFinding.message || legacyFinding.user_message,
            evidence: legacyFinding.evidence || {}
        });
    }

    /**
     * Maps legacy BPE payload to a hardened JobSpec object.
     * @param {object} legacyBpe 
     */
    mapJobSpec(legacyBpe) {
        if (!legacyBpe) return null;

        return new JobSpec({
            jobId: legacyBpe.id || "legacy_job_" + Date.now(),
            trim: {
                widthMm: legacyBpe.trimWidth || 148,
                heightMm: legacyBpe.trimHeight || 210
            },
            pageCount: legacyBpe.pageCount || 1,
            paper: {
                interiorCategory: legacyBpe.paperCategory || "uncoated",
                caliperMm: legacyBpe.paperCaliperMm || 0.1
            }
        });
    }
}

module.exports = new LegacyToKernelMapper();
