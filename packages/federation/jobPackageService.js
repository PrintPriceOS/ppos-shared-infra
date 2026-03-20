// ppos-shared-infra/packages/federation/jobPackageService.js
const db = require('../data/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const AssetDeliveryService = require('./assetDeliveryService');

/**
 * JobPackageService (Phase 23.D)
 * Builds production manifests (packages) for printers.
 */
class JobPackageService {
    /**
     * Build a production manifestation for an accepted dispatch
     */
    static async createPackage(dispatchId) {
        // 1. Fetch dispatch and job data
        const sql = `
            SELECT d.*, j.data as job_data, j.id as job_id
            FROM federated_dispatches d
            JOIN jobs j ON d.job_id = j.id
            WHERE d.id = ? AND d.dispatch_status = 'accepted'
        `;
        const { rows } = await db.query(sql, [dispatchId]);
        if (rows.length === 0) throw new Error('Dispatch not found or not accepted');

        const dispatch = rows[0];
        const jobData = typeof dispatch.job_data === 'string' ? JSON.parse(dispatch.job_data) : dispatch.job_data;

        // 2. Resolve assets and generate signed URLs
        const assets = (jobData.assets || []).map(a => {
            const signed = AssetDeliveryService.generateSignedUrl(a.path, dispatch.printer_id);
            return {
                type: a.type || 'print_pdf',
                url: signed.url,
                sha256: a.sha256 || 'placeholder_hash',
                size: a.size || 0,
                expiresAt: signed.expiresAt
            };
        });

        // 3. Build Manifest
        const manifest = {
            id: uuidv4(),
            dispatchId,
            jobId: dispatch.job_id,
            printerId: dispatch.printer_id,
            productionSpec: {
                format: jobData.format,
                binding: jobData.binding,
                colorMode: jobData.colorMode,
                copies: jobData.copies,
                pages: jobData.pages
            },
            assets,
            deadline: jobData.deadline,
            idempotencyToken: `PPOS_${dispatchId.substring(0,8)}`
        };

        const manifestString = JSON.stringify(manifest);
        const manifestHash = crypto.createHash('sha256').update(manifestString).digest('hex');

        // 4. Persistence
        const id = uuidv4();
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 4); // Package live for 4h

        await db.query(`
            INSERT INTO federated_job_packages (
                id, dispatch_id, job_id, printer_id, package_status, manifest, manifest_hash, expires_at
            ) VALUES (?, ?, ?, ?, 'ready', ?, ?, ?)
        `, [
            id,
            dispatchId,
            dispatch.job_id,
            dispatch.printer_id,
            manifestString,
            manifestHash,
            expiry
        ]);

        return manifest;
    }

    /**
     * Get ready package manifest
     */
    static async getPackage(dispatchId, printerId) {
        const sql = `
            SELECT * FROM federated_job_packages 
            WHERE dispatch_id = ? AND printer_id = ? AND package_status IN ('ready', 'downloaded')
        `;
        const { rows } = await db.query(sql, [dispatchId, printerId]);
        return rows[0] ? JSON.parse(rows[0].manifest) : null;
    }

    /**
     * Update package status
     */
    static async updatePackageStatus(dispatchId, status, failureReason = null) {
        const sql = `
            UPDATE federated_job_packages 
            SET 
                package_status = ?, 
                failure_reason = ?,
                downloaded_at = IF(? = 'downloaded', CURRENT_TIMESTAMP, downloaded_at),
                received_at = IF(? = 'received', CURRENT_TIMESTAMP, received_at)
            WHERE dispatch_id = ?
        `;
        await db.query(sql, [status, failureReason, status, status, dispatchId]);
    }
}

module.exports = JobPackageService;
