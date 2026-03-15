/**
 * @project PrintPrice Pro - Platform Kernel
 */
const JobSpec = require('./domain/jobSpec');
const Finding = require('./domain/finding');
const Tenant = require('./domain/tenant');
const validator = require('./validation/validateKernelObject');
const legacyMapper = require('./mappers/legacyToKernelMapper');

/**
 * PrintPrice OS Platform Kernel (V10)
 * Responsibility: Consolidate the full architecture into a stable, versioned Core.
 */
class PlatformKernel {
    constructor() {
        this.version = "v10.0";
        this.JobSpec = JobSpec;
        this.Finding = Finding;
        this.Tenant = Tenant;
        this.validator = validator;
        this.legacyMapper = legacyMapper;
    }

    /**
     * Build the Canonical Report Contract.
     * @param {object} input 
     */
    assembleReport(input) {
        if (!input.jobSpec) throw new Error("jobSpec is required for report assembly.");

        return {
            schemaVersion: this.version,
            jobSpec: input.jobSpec,
            preflight: input.preflight || {},
            physicalValidation: input.physicalValidation || {},
            strategy: input.strategy || {},
            economics: input.economics || {},
            matchmaking: input.matchmaking || {},
            routing: input.routing || {},
            explainability: input.explainability || {},
            learning: input.learning || {},
            metadata: {
                platformKernel: this.version,
                generatedAt: new Date().toISOString()
            }
        };
    }
}

module.exports = new PlatformKernel();
