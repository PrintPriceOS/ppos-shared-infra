/**
 * @ppos/shared-infra - EmergencyRestrictionManager
 * 
 * Enforces restrictive local overrides when global authority is unavailable.
 */
class EmergencyRestrictionManager {
    constructor() {
        this.activeRestrictions = new Set();
    }

    /**
     * Adds a restrictive local rule.
     */
    restrict(capability) {
        console.log(`[GOV-EMERGENCY] Restricting capability: ${capability}`);
        this.activeRestrictions.add(capability);
    }

    /**
     * Clears local restrictions.
     */
    clear() {
        this.activeRestrictions.clear();
    }

    /**
     * Wraps a governance decision with local safety checks.
     */
    enforce(decision) {
        if (!decision.allow) return decision; // Already denied

        // Check if the capability is locally restricted
        if (this.activeRestrictions.has(decision.capability) || this.activeRestrictions.has('*')) {
            return {
                allow: false,
                reason: 'EMERGENCY_LOCAL_RESTRICTION',
                capability: decision.capability
            };
        }

        return decision;
    }

    /**
     * Example: Block all new on-boarding during partition.
     */
    isRestricted(capability) {
        return this.activeRestrictions.has(capability);
    }
}

module.exports = new EmergencyRestrictionManager();
