const fs = require('fs');
const path = require('path');

/**
 * ConflictDetector (Phase v1.6.0)
 * 
 * Arbitrates between regional events using versioning and authority epochs.
 * Prevents stale updates and detects split-brain divergences.
 */
class ConflictDetector {
    constructor(storageProvider = null) {
        this.versionStorePath = path.join(process.cwd(), '.runtime', 'fss-convergence', 'versions.json');
        this.storage = storageProvider || this.getFallbackStorage();
        this.versions = {}; // Memory cache for local speed
    }

    getFallbackStorage() {
        return {
            load: () => {
                if (fs.existsSync(this.versionStorePath)) {
                    return JSON.parse(fs.readFileSync(this.versionStorePath, 'utf8'));
                }
                return {};
            },
            save: (data) => {
                fs.writeFileSync(this.versionStorePath, JSON.stringify(data, null, 2));
            },
            isDurable: false
        };
    }

    async init() {
        this.versions = await this.storage.load();
    }

    /**
     * Inspects an event for potential conflicts before application.
     * In v1.8.0, this is async to support shared backend state fetching.
     * 
     * @returns {Object} { conflict: boolean, reason: string, code: string }
     */
    async inspect(envelope) {
        const { entity_type, entity_id, state_version, authority_epoch } = envelope;
        
        if (!entity_type || !entity_id) return { conflict: false };

        const key = `${entity_type}:${entity_id}`;
        
        // Fetch from shared storage if possible, else fallback to memory cache
        let local;
        if (this.storage.get) {
            local = await this.storage.get(entity_type, entity_id);
        }
        
        if (!local) {
            local = this.versions[key] || { state_version: 0, authority_epoch: 0 };
        }

        // 1. Authority Epoch Check
        if (authority_epoch < local.authority_epoch) {
            console.log(`[CONFLICT] Stale epoch for ${key}: Event(${authority_epoch}) < Local(${local.authority_epoch})`);
            return { 
                conflict: true, 
                reason: `Stale authority epoch: Event(${authority_epoch}) < Local(${local.authority_epoch})`,
                code: 'STALE_EPOCH'
            };
        }

        // 2. State Version Check
        if (authority_epoch === local.authority_epoch) {
            if (state_version < local.state_version) {
                console.log(`[CONFLICT] Stale version for ${key}: Event(${state_version}) < Local(${local.state_version})`);
                return {
                    conflict: true,
                    reason: `Stale state version: Event(${state_version}) < Local(${local.state_version})`,
                    code: 'STALE_VERSION'
                };
            }
            if (state_version === local.state_version) {
                 // Might be a duplicate or an idempotent re-send
                return { conflict: false, duplicate: true };
            }
        }
        
        return { conflict: false };
    }

    async update(envelope) {
        const { entity_type, entity_id, state_version, authority_epoch } = envelope;
        if (!entity_type || !entity_id) return;

        const key = `${entity_type}:${entity_id}`;
        const record = {
            state_version: state_version || 0,
            authority_epoch: authority_epoch || 0,
            updated_at: new Date().toISOString()
        };

        this.versions[key] = record;
        
        if (this.storage.saveOne) {
            await this.storage.saveOne(entity_type, entity_id, record);
        } else {
            await this.storage.save(this.versions);
        }
    }

}

module.exports = new ConflictDetector();
