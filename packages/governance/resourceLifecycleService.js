// ppos-shared-infra/packages/governance/resourceLifecycleService.js
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * ResourceLifecycleService (Phase R13 - H2)
 * Handles automatic cleanup of temporary files and system resources.
 */
class ResourceLifecycleService {
    /**
     * Mandatory cleanup for job-related assets
     * @param {Object} data { asset_path, output_path }
     */
    static async cleanupJobResources(data) {
        if (!data) return;
        const targets = [data.asset_path, data.output_path].filter(p => p && typeof p === 'string');
        const configuredTemp = process.env.PPOS_TEMP_DIR || 'ppos-preflight';

        for (const target of targets) {
            try {
                // Security check: only cleanup within authorized dirs
                const normalizedPath = path.normalize(target);
                if (
                    normalizedPath.includes(configuredTemp) || 
                    normalizedPath.includes('ppos-preflight') || 
                    normalizedPath.includes('.runtime') ||
                    normalizedPath.includes('ppos-tmp')
                ) {
                    const stats = await fs.stat(normalizedPath).catch(() => null);
                    if (stats) {
                        await fs.rm(normalizedPath, { force: true, recursive: true });
                        console.log(`[LIFECYCLE] Purged: ${normalizedPath}`);
                    }
                }
            } catch (err) {
                console.error(`[LIFECYCLE-ERROR] Failed to cleanup ${target}:`, err.message);
            }
        }
    }

    /**
     * Full Janitor Sweep for dangling files
     * @param {string} targetDir
     * @param {number} maxAgeMs (default 10 mins)
     */
    static async janitorSweep(targetDir = null, maxAgeMs = 600000) {
        // Resolve target directory (handle Windows/Unix)
        let resolvedDir = targetDir || process.env.PPOS_TEMP_DIR || '/tmp/ppos-preflight';
        if (os.platform() === 'win32' && targetDir.startsWith('/tmp')) {
             resolvedDir = path.join(os.tmpdir(), targetDir.replace('/tmp/', ''));
        }

        try {
            const stats = await fs.stat(resolvedDir).catch(() => null);
            if (!stats) return; // Directory doesn't exist

            const now = Date.now();
            const files = await fs.readdir(resolvedDir).catch(() => []);
            let purgedCount = 0;

            for (const file of files) {
                const fullPath = path.join(resolvedDir, file);
                const itemStats = await fs.stat(fullPath).catch(() => null);
                
                if (itemStats && (now - itemStats.mtimeMs) > maxAgeMs) {
                    await fs.rm(fullPath, { force: true, recursive: true }).catch(() => {});
                    purgedCount++;
                }
            }
            
            if (purgedCount > 0) {
                console.log(`[LIFECYCLE-JANITOR] Sweep complete in ${resolvedDir}. Purged ${purgedCount} orphaned items.`);
            }
        } catch (err) {
            console.error(`[LIFECYCLE-JANITOR-ERROR] Sweep failed:`, err.message);
        }
    }
}

module.exports = ResourceLifecycleService;
