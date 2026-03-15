/**
 * @project PrintPrice Pro - Ecosystem Connector Runtime
 * @author Manuel Enrique Morales (https://manuelenriquemorales.com/)
 * @social https://x.com/manuel_emorales | https://www.linkedin.com/in/manuelenriquemorales/
 */

/**
 * Connector Domain Object (V14)
 * Responsibility: Define the structure of an external system connector.
 */
class Connector {
    constructor(data) {
        this.connectorId = data.connectorId;
        this.connectorType = data.connectorType; // e.g., woocommerce, shopify, erp
        this.status = data.status || 'active';
        this.tenantId = data.tenantId;
        this.capabilities = data.capabilities || []; // e.g., job_ingest, status_sync
        this.authProfile = data.authProfile;
        this.mappingProfile = data.mappingProfile;
        this.retryPolicy = data.retryPolicy || 'standard';
        this.config = data.config || {};
        this.metadata = data.metadata || { createdAt: new Date().toISOString() };
    }

    validate() {
        const required = ['connectorId', 'connectorType', 'tenantId'];
        required.forEach(field => {
            if (!this[field]) throw new Error(`MISSING_CONNECTOR_FIELD: ${field}`);
        });

        const validTypes = ['woocommerce', 'shopify', 'erp', 'mis', 'printer_partner', 'logistics', 'procurement', 'generic_api'];
        if (!validTypes.includes(this.connectorType)) {
            throw new Error(`INVALID_CONNECTOR_TYPE: ${this.connectorType}`);
        }
    }
}

module.exports = Connector;
