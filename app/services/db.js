/**
 * Monolith DB Client Proxy
 * Redirects to the federated @ppos/shared-infra package.
 */
try {
    const { db } = require('@ppos/shared-infra');
    module.exports = db;
} catch (err) {
    console.warn('[MONOLITH-DB] @ppos/shared-infra not linked, falling back to relative path');
    module.exports = require('../../workspace/PrintPriceOS_Workspace/ppos-shared-infra/packages/data/db');
}






















