/**
 * Reducer Registry (Phase v1.7.0)
 * 
 * Centralizes the specialized logic for applying federated events.
 */
class ReducerRegistry {
    constructor() {
        this.reducers = new Map();
        this.loadDefaultReducers();
    }

    loadDefaultReducers() {
        // We'll manualy register for now to avoid dynamic require issues in some environments
        this.register('PolicyPublished', require('./PolicyPublished'));
        this.register('PrinterNodeRegistered', require('./PrinterNodeRegistered'));
        this.register('TenantConfigUpdated', require('./TenantConfigUpdated'));
        // Fallback or generic reducers can be added here
    }

    register(eventTypeName, reducer) {
        this.reducers.set(eventTypeName, reducer);
    }

    getReducer(eventTypeName) {
        return this.reducers.get(eventTypeName);
    }
}

module.exports = new ReducerRegistry();
