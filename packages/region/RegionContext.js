/**
 * @ppos/shared-infra - RegionContext
 * 
 * Provides environment-driven region awareness for the PPOS instance.
 */
const SecretManager = require('../ops/SecretManager');

class RegionContext {
    constructor() {
        this.regionId = process.env.PPOS_REGION_ID || 'DEV-LOCAL';
        this.regionRole = process.env.PPOS_REGION_ROLE || 'primary';
        this.residencyMode = process.env.PPOS_RESIDENCY_MODE || 'strict';
        this.complianceProfile = process.env.PPOS_COMPLIANCE_PROFILE || 'GDPR-MINIMAL';
        this.allowedGlobalClasses = (process.env.PPOS_ALLOWED_GLOBAL_CLASSES || 'governance,org_registry,printer_identity,health_summary').split(',');

        this.validate();
    }

    validate() {
        if (process.env.NODE_ENV === 'production' && this.regionId === 'DEV-LOCAL') {
            throw new Error('[REGION-CRITICAL] PPOS_REGION_ID must be explicitly set in production.');
        }

        const validRoles = ['primary', 'secondary', 'edge'];
        if (!validRoles.includes(this.regionRole)) {
            throw new Error(`[REGION-ERROR] Invalid PPOS_REGION_ROLE: ${this.regionRole}`);
        }
    }

    get() {
        return {
            region_id: this.regionId,
            region_role: this.regionRole,
            residency_mode: this.residencyMode,
            compliance_profile: this.complianceProfile,
            allowed_global_classes: this.allowedGlobalClasses
        };
    }
}

module.exports = new RegionContext();
