// ppos-shared-infra/packages/federation/printerCredentialService.js
const db = require('../data/db');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * PrinterCredentialService (Phase 23.B.1)
 * Manages secure HMAC credentials for federated partners.
 */
class PrinterCredentialService {
    /**
     * Generate new HMAC credentials for a printer
     */
    static async createCredentials(printerId, label = 'default') {
        const keyId = `ppos_key_${crypto.randomBytes(8).toString('hex')}`;
        const secret = crypto.randomBytes(32).toString('hex');
        
        // We store the secret as a hash for security, but we need to return the raw secret ONCE
        const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

        const id = uuidv4();
        const sql = `
            INSERT INTO printer_credentials (
                id, printer_id, credential_type, key_id, secret_hash, status
            ) VALUES (?, ?, 'hmac', ?, ?, 'active')
        `;

        await db.query(sql, [id, printerId, keyId, secretHash]);

        return {
            keyId,
            secret, // RETURNED ONLY ONCE AT CREATION
            expiresAt: null
        };
    }

    /**
     * Get secret hash for verification
     */
    static async getSecretHash(keyId) {
        const sql = `SELECT secret_hash, printer_id, status FROM printer_credentials WHERE key_id = ? AND status = 'active'`;
        const { rows } = await db.query(sql, [keyId]);
        return rows[0] || null;
    }

    /**
     * HMAC Signature Verification Logic (Phase 23.B.1.2)
     */
    static verifySignature(params) {
        const { method, path, timestamp, nonce, body, secret, signature } = params;
        
        // 1. Check timestamp (Tolerance: 5 minutes)
        const ts = new Date(timestamp).getTime();
        const now = Date.now();
        if (Math.abs(now - ts) > 300000) return false;

        // 2. Re-create string to sign
        // Format: METHOD|PATH|TIMESTAMP|NONCE|BODY_HASH
        const bodyHash = crypto.createHash('sha256').update(body || '').digest('hex');
        const stringToSign = `${method.toUpperCase()}|${path}|${timestamp}|${nonce}|${bodyHash}`;

        // 3. Compute expected signature
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(stringToSign)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }
}

module.exports = PrinterCredentialService;
