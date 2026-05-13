// ppos-shared-infra/packages/contracts/preflightIntegrityContract.js

const FAILURE_CATEGORIES = {
    ENGINE_ENVIRONMENT_FAILURE: 'ENGINE_ENVIRONMENT_FAILURE',
    DOCUMENT_PREFLIGHT_FAILURE: 'DOCUMENT_PREFLIGHT_FAILURE',
    DOCUMENT_CERTIFICATION_FAILURE: 'DOCUMENT_CERTIFICATION_FAILURE'
};

const SCORE_BASIS = {
    REAL_ANALYSIS: 'REAL_ANALYSIS',
    PARTIAL_ANALYSIS: 'PARTIAL_ANALYSIS',
    ENVIRONMENT_FAILURE: 'ENVIRONMENT_FAILURE'
};

class PreflightIntegrityContract {
    /**
     * Normalizes the analysis integrity sub-contract from a raw or contradictory payload.
     * Guaranteed to return a canonical interpretation of extraction fidelity.
     * @param {Object} payload - The preflight job payload or partial integrity object
     * @returns {Object} Canonical analysisIntegrity object
     */
    static normalizeAnalysisIntegrity(payload) {
        if (!payload || typeof payload !== 'object') {
            payload = {};
        }

        const integrityInput = payload.analysisIntegrity || {};

        // 1. Extract and normalize missingTools
        let missingTools = [];
        const rawMissing = payload.missing_tools || payload.missingTools || integrityInput.missingTools || integrityInput.missing_tools;
        if (Array.isArray(rawMissing)) {
            missingTools = rawMissing.flat().filter(t => t && typeof t === 'string').map(t => t.trim());
        } else if (typeof rawMissing === 'string') {
            missingTools = rawMissing.split(/[,;\s]+/).filter(Boolean).map(t => t.trim());
        }
        // Deduplicate
        missingTools = [...new Set(missingTools)];

        // 2. Extract and normalize extractionErrors
        let extractionErrors = [];
        const rawErrors = payload.extraction_errors || payload.extractionErrors || integrityInput.extractionErrors || integrityInput.extraction_errors;
        if (Array.isArray(rawErrors)) {
            extractionErrors = [...rawErrors];
        } else if (rawErrors) {
            extractionErrors = [rawErrors];
        }

        // 3. Detect environment failures (missing tools or ENOENT errors)
        const hasMissingTools = missingTools.length > 0;
        const hasEnoent = extractionErrors.some(err => {
            if (!err) return false;
            if (typeof err === 'string') return err.includes('ENOENT');
            if (err.code === 'ENOENT') return true;
            if (err.message && err.message.includes('ENOENT')) return true;
            return false;
        });

        const isEnvFailure = hasMissingTools || hasEnoent;

        // 4. Check if explicitly marked as degraded at top level or integrity level
        const topLevelDegraded = payload.analysis_type === 'DEGRADED' || payload.analysis_status === 'DEGRADED';
        const inputDegradedMode = integrityInput.degradedMode === true;
        
        // Enforce canonical invariant:
        // If missingTools > 0 OR extractionErrors has ENOENT, OR previously marked degraded:
        // degradedMode=true, realExtraction=false, fallbackUsed=true, certificationAllowed=false, scoreAllowed=false
        const shouldBeDegraded = isEnvFailure || topLevelDegraded || inputDegradedMode;

        let degradedMode = false;
        let realExtraction = true;
        let fallbackUsed = integrityInput.fallbackUsed === true || payload.fallback_used === true;
        let blockingEnvironmentFailure = integrityInput.blockingEnvironmentFailure === true;
        let certificationAllowed = integrityInput.certificationAllowed !== false;
        let scoreAllowed = integrityInput.scoreAllowed !== false;
        let scoreBasis = integrityInput.scoreBasis || SCORE_BASIS.REAL_ANALYSIS;

        if (shouldBeDegraded) {
            degradedMode = true;
            realExtraction = false;
            // Ensure fallbackUsed=true or environmentFailure=true
            if (isEnvFailure) {
                blockingEnvironmentFailure = true;
                fallbackUsed = true;
                scoreBasis = SCORE_BASIS.ENVIRONMENT_FAILURE;
            } else {
                fallbackUsed = true; // Fallback must have been used to produce partial results
                if (scoreBasis === SCORE_BASIS.REAL_ANALYSIS) {
                    scoreBasis = SCORE_BASIS.PARTIAL_ANALYSIS;
                }
            }
            certificationAllowed = false;
            scoreAllowed = false;
        } else {
            // Check if input explicitly sets properties validly
            if (integrityInput.realExtraction === false) {
                realExtraction = false;
            }
            if (integrityInput.blockingEnvironmentFailure === true) {
                blockingEnvironmentFailure = true;
                scoreBasis = SCORE_BASIS.ENVIRONMENT_FAILURE;
                scoreAllowed = false;
                certificationAllowed = false;
            }
            if (integrityInput.fallbackUsed === true) {
                fallbackUsed = true;
            }
        }

        return {
            degradedMode,
            fallbackUsed,
            realExtraction,
            missingTools,
            extractionErrors,
            blockingEnvironmentFailure,
            certificationAllowed,
            scoreAllowed,
            scoreBasis
        };
    }

    /**
     * Normalizes the entire preflight job payload, resolving all contradictory integrity states.
     * Ensures risk score and certification properties conform to the invariant.
     * @param {Object} payload - Raw preflight job payload
     * @returns {Object} Fully canonicalized and patched payload object
     */
    static normalizeJobPayload(payload) {
        if (!payload || typeof payload !== 'object') {
            throw new Error('Payload must be a valid object');
        }

        // Shallow copy top-level to prevent mutating caller references unexpectedly, but allow deeper patches safely
        const normalized = { ...payload };

        // Normalize the core integrity model
        const canonicalIntegrity = this.normalizeAnalysisIntegrity(normalized);
        normalized.analysisIntegrity = canonicalIntegrity;

        // Synchronize top-level fields to prevent any contradiction
        if (canonicalIntegrity.degradedMode) {
            normalized.analysis_type = 'DEGRADED';
            normalized.analysis_status = 'DEGRADED';
        } else {
            // If it wasn't degraded, ensure top level doesn't falsely claim degraded if realExtraction is true
            if (!normalized.analysis_type) normalized.analysis_type = 'REAL_EXTRACTION';
            if (!normalized.analysis_status) normalized.analysis_status = 'SUCCESS';
        }

        if (canonicalIntegrity.missingTools && canonicalIntegrity.missingTools.length > 0) {
            normalized.missing_tools = canonicalIntegrity.missingTools;
        }

        // Apply invariant to Risk Score: null or scoreBasis=ENVIRONMENT_FAILURE when environment is invalid
        if (canonicalIntegrity.blockingEnvironmentFailure || !canonicalIntegrity.scoreAllowed) {
            if (normalized.risk_score !== undefined) normalized.risk_score = null;
            if (normalized.riskScore !== undefined) normalized.riskScore = null;
        }

        // Apply invariant to Certification: impossible when analysis integrity is degraded
        if (!canonicalIntegrity.certificationAllowed) {
            normalized.certification_possible = false;
            if (normalized.certification && typeof normalized.certification === 'object') {
                normalized.certification = {
                    ...normalized.certification,
                    allowed: false,
                    certified: false,
                    reason: canonicalIntegrity.blockingEnvironmentFailure 
                        ? 'Certification blocked due to runtime environment failure'
                        : 'Certification impossible in degraded analysis mode'
                };
            } else {
                normalized.certification = {
                    allowed: false,
                    certified: false,
                    reason: 'Certification impossible in degraded analysis mode'
                };
            }
        }

        return normalized;
    }

    /**
     * Categorizes and maps failures into canonical status/severity interpretations.
     * Separates infrastructure/runtime failures from document defects.
     * @param {Object|string} errorOrPayload - Error object/string or job payload
     * @returns {Object} Canonical failure classification mapping
     */
    static classifyFailure(errorOrPayload) {
        let isMissingBinary = false;
        let details = '';

        if (!errorOrPayload) {
            return {
                severity: 'ERROR',
                category: FAILURE_CATEGORIES.DOCUMENT_PREFLIGHT_FAILURE,
                isDocumentDefect: true,
                isRuntimeFailure: false,
                status: 'FAILED_PREFLIGHT',
                message: 'Unknown document preflight failure'
            };
        }

        if (typeof errorOrPayload === 'string') {
            details = errorOrPayload;
        } else if (errorOrPayload instanceof Error) {
            details = `${errorOrPayload.code || ''} ${errorOrPayload.message || ''} ${errorOrPayload.stack || ''}`;
        } else if (typeof errorOrPayload === 'object') {
            // Check if it's a payload or structured error
            const integrity = errorOrPayload.analysisIntegrity || {};
            if (integrity.blockingEnvironmentFailure || (integrity.missingTools && integrity.missingTools.length > 0)) {
                isMissingBinary = true;
            }
            const missing = errorOrPayload.missing_tools || errorOrPayload.missingTools;
            if (missing && (Array.isArray(missing) ? missing.length > 0 : true)) {
                isMissingBinary = true;
            }
            details = JSON.stringify(errorOrPayload);
        }

        const upperDetails = details.toUpperCase();
        if (
            upperDetails.includes('ENOENT') ||
            upperDetails.includes('MISSING_TOOL') ||
            upperDetails.includes('IND_INTEGRITY_MISSING_TOOL') ||
            upperDetails.includes('COMMAND NOT FOUND') ||
            upperDetails.includes('PDFINFO=MISSING') ||
            upperDetails.includes('PDFIMAGES=MISSING') ||
            upperDetails.includes('MUTOOL=MISSING') ||
            upperDetails.includes('GHOSTSCRIPT=MISSING') ||
            isMissingBinary
        ) {
            return {
                severity: 'CRITICAL',
                category: FAILURE_CATEGORIES.ENGINE_ENVIRONMENT_FAILURE,
                isDocumentDefect: false,
                isRuntimeFailure: true,
                status: 'FAILED_RUNTIME_ENVIRONMENT',
                message: 'Infrastructure/runtime environment failure: critical industrial PDF tools are missing.'
            };
        }

        if (upperDetails.includes('CERTIFICATION') || upperDetails.includes('POLICY_DENY')) {
            return {
                severity: 'WARNING',
                category: FAILURE_CATEGORIES.DOCUMENT_CERTIFICATION_FAILURE,
                isDocumentDefect: true,
                isRuntimeFailure: false,
                status: 'FAILED_CERTIFICATION',
                message: 'Document failed certification standards or policy constraints.'
            };
        }

        return {
            severity: 'ERROR',
            category: FAILURE_CATEGORIES.DOCUMENT_PREFLIGHT_FAILURE,
            isDocumentDefect: true,
            isRuntimeFailure: false,
            status: 'FAILED_PREFLIGHT',
            message: 'Document analysis preflight failure due to structure or extraction error.'
        };
    }

    /**
     * Orchestrates a preflight job, evaluating preflight payload integrity.
     * Rejects or marks jobs as FAILED_RUNTIME_ENVIRONMENT when critical tools are absent.
     * @param {Object} jobPayload - The incoming preflight job payload
     * @returns {Object} Orchestration result object
     */
    static orchestratePreflightJob(jobPayload) {
        const normalized = this.normalizeJobPayload(jobPayload);
        const integrity = normalized.analysisIntegrity;

        if (integrity.blockingEnvironmentFailure || (integrity.missingTools && integrity.missingTools.length > 0)) {
            const classification = this.classifyFailure(normalized);
            
            // Mark job payload with infrastructure failure status
            normalized.job_status = classification.status;
            normalized.status = classification.status;
            normalized.analysis_status = 'FAILED';
            normalized.failure_category = classification.category;
            normalized.error_details = classification.message;

            return {
                accepted: false,
                rejected: true,
                status: classification.status,
                failureCategory: classification.category,
                reason: classification.message,
                payload: normalized
            };
        }

        return {
            accepted: true,
            rejected: false,
            status: normalized.job_status || normalized.status || 'PROCESSED',
            payload: normalized
        };
    }

    /**
     * Enforces invariant that downstream services cannot override DEGRADED into REAL_EXTRACTION.
     * Intercepts updates to ensure extraction fidelity is monotonically non-increasing.
     * @param {Object} originalPayload - The previously established/upstream job payload
     * @param {Object} updatedPayload - The proposed downstream updates to the payload
     * @returns {Object} The securely reconciled job payload
     */
    static enforceDownstreamIntegrity(originalPayload, updatedPayload) {
        if (!originalPayload) return this.normalizeJobPayload(updatedPayload);
        
        const origNormalized = this.normalizeJobPayload(originalPayload);
        const newNormalized = this.normalizeJobPayload(updatedPayload);

        // If upstream was degraded, downstream MUST remain degraded.
        if (origNormalized.analysisIntegrity.degradedMode) {
            if (!newNormalized.analysisIntegrity.degradedMode || newNormalized.analysisIntegrity.realExtraction) {
                console.warn('[CONTRACT-SECURITY] Blocked illegal downstream override attempt from DEGRADED to REAL_EXTRACTION.');
                
                // Forcibly revert integrity parameters back to degraded state
                newNormalized.analysisIntegrity.degradedMode = true;
                newNormalized.analysisIntegrity.realExtraction = false;
                newNormalized.analysisIntegrity.fallbackUsed = true;
                newNormalized.analysisIntegrity.certificationAllowed = false;
                newNormalized.analysisIntegrity.scoreAllowed = false;
                
                // Keep scoreBasis as ENVIRONMENT_FAILURE if it originally was
                if (origNormalized.analysisIntegrity.scoreBasis === SCORE_BASIS.ENVIRONMENT_FAILURE) {
                    newNormalized.analysisIntegrity.scoreBasis = SCORE_BASIS.ENVIRONMENT_FAILURE;
                    newNormalized.analysisIntegrity.blockingEnvironmentFailure = true;
                } else {
                    newNormalized.analysisIntegrity.scoreBasis = SCORE_BASIS.PARTIAL_ANALYSIS;
                }

                // Restore top level flags
                newNormalized.analysis_type = 'DEGRADED';
                newNormalized.analysis_status = 'DEGRADED';
                newNormalized.certification_possible = false;
                if (newNormalized.certification) {
                    newNormalized.certification.allowed = false;
                    newNormalized.certification.certified = false;
                }
                
                // Nullify risk score if environment failure or score is not allowed
                if (newNormalized.analysisIntegrity.blockingEnvironmentFailure || !newNormalized.analysisIntegrity.scoreAllowed) {
                    if (newNormalized.risk_score !== undefined) newNormalized.risk_score = null;
                    if (newNormalized.riskScore !== undefined) newNormalized.riskScore = null;
                }
            }
        }

        return newNormalized;
    }
}

module.exports = {
    FAILURE_CATEGORIES,
    SCORE_BASIS,
    PreflightIntegrityContract
};
