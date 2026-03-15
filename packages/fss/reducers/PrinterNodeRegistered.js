const printerRegistryService = require('../../federation/printerRegistryService');

/**
 * PrinterNodeRegistered Reducer (Phase v1.7.0)
 * Handles printer identity synchronization.
 */
module.exports = {
    async apply(envelope) {
        const { payload } = envelope;
        console.log(`[REDUCER:PrinterNodeRegistered] Syncing printer ${payload.id || payload.printerId}`);
        
        // Materialize side-effect (UPSERT)
        await printerRegistryService.registerPrinter(payload);
        
        return { ok: true, materialized: 'PRINTER_UPSERTED' };
    }
};
