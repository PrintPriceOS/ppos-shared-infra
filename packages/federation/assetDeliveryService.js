// ppos-shared-infra/packages/federation/assetDeliveryService.js
const crypto = require('crypto');

/**
 * AssetDeliveryService (Phase 23.D)
 * Manages secure, short-lived URLs for production assets.
 */
const SecretManager = require('../ops/SecretManager');

class AssetDeliveryService {
    /**
     * Generate a signed URL for a private asset
     * @param {string} assetPath Path to the file in storage
     * @param {string} printerId Target node id
     * @param {number} ttlSeconds Expiration (default 4h)
     */
    static generateSignedUrl(assetPath, printerId, ttlSeconds = 14400) {
        const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
        const secret = SecretManager.get('ASSET_SIGNING_SECRET') || 'ppos-secret-2026';
        
        // Build a raw string: PATH|PRINTER_ID|EXPIRY
        const raw = `${assetPath}|${printerId}|${expiresAt}`;
        const signature = crypto
            .createHmac('sha256', secret)
            .update(raw)
            .digest('hex');

        // Hypothetical CDN/Storage base URL
        const baseUrl = process.env.ASSET_CDN_URL || 'https://assets.printprice.os';
        
        return {
            url: `${baseUrl}/${assetPath}?p=${printerId}&e=${expiresAt}&s=${signature}`,
            expiresAt: new Date(expiresAt * 1000).toISOString(),
            signature
        };
    }

    /**
     * Verify a signed URL (used by the asset-serving gateway)
     */
    static verifyToken(urlParams) {
        const { p, e, s, path } = urlParams;
        if (!p || !e || !s) return false;

        // Check expiry
        if (parseInt(e) < Math.floor(Date.now() / 1000)) return false;

        const secret = SecretManager.get('ASSET_SIGNING_SECRET') || 'ppos-secret-2026';
        const expectedRaw = `${path}|${p}|${e}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(expectedRaw)
            .digest('hex');

        return crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expectedSignature));
    }
}

module.exports = AssetDeliveryService;
