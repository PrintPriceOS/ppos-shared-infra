/**
 * @project PrintPrice Pro - Platform Kernel
 */

/**
 * Tenant Canonical Object (V9.5 / V10)
 * Responsibility: Hardened tenant profile and feature scope.
 */
class Tenant {
    constructor(data = {}) {
        this.schemaVersion = "v10.0";
        this.tenantId = data.tenantId || `tenant_${Date.now()}`;
        this.tenantType = data.tenantType || 'publisher'; // publisher, broker, enterprise, partner_printer, white_label, internal_ops
        this.status = data.status || 'active';
        this.name = data.name || 'Untitled Tenant';
        this.brandProfile = {
            displayName: data.brandProfile?.displayName || this.name,
            theme: data.brandProfile?.theme || 'light'
        };
        this.featureProfile = {
            preflightAccess: data.featureProfile?.preflightAccess ?? true,
            routingSummaryVisible: data.featureProfile?.routingSummaryVisible ?? true,
            partnerComparisonVisible: data.featureProfile?.partnerComparisonVisible ?? false,
            scenarioPlanningVisible: data.featureProfile?.scenarioPlanningVisible ?? false,
            economicInsightsVisible: data.featureProfile?.economicInsightsVisible ?? false
        };
        this.dataScope = {
            allowedRegions: data.dataScope?.allowedRegions || ["EU"],
            allowedPartners: data.dataScope?.allowedPartners || []
        };
        this.metadata = {
            createdAt: data.metadata?.createdAt || new Date().toISOString()
        };
    }

    validate() {
        const validTypes = ['publisher', 'broker', 'enterprise', 'partner_printer', 'white_label', 'internal_ops'];
        if (!validTypes.includes(this.tenantType)) throw new Error(`Invalid tenant type: ${this.tenantType}`);
        if (!this.tenantId) throw new Error("tenantId is required");
        return true;
    }
}

module.exports = Tenant;
