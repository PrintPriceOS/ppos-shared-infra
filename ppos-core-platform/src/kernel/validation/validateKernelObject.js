/**
 * @project PrintPrice Pro - Platform Kernel
 */
const JobSpec = require('../domain/jobSpec');
const Finding = require('../domain/finding');

/**
 * Platform Kernel Object Validator
 * Responsibility: Strict validation of objects passed between engines.
 */
class ValidateKernelObject {
    /**
     * Validate an object against its domain type.
     * @param {object} object 
     * @param {string} domainType 
     */
    validate(object, domainType) {
        if (!object) throw new Error("Object to validate is null or undefined.");

        switch (domainType) {
            case 'JobSpec':
                const jobSpec = new JobSpec(object);
                return jobSpec.validate();
            case 'Finding':
                const finding = new Finding(object);
                return finding.validate();
            default:
                throw new Error(`Validation for domain type ${domainType} is not yet implemented.`);
        }
    }
}

module.exports = new ValidateKernelObject();
