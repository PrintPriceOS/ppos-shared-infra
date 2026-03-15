const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');

const OIDC_ISSUER = process.env.OIDC_ISSUER;
const OIDC_AUDIENCE = process.env.OIDC_AUDIENCE || 'ppos:control';
const JWT_SECRET = process.env.JWT_SECRET || 'ppos-dev-only-secret-2026';

// Client for fetching signing keys from the Identity Provider
const jwksClient = OIDC_ISSUER ? jwksRsa({
    jwksUri: `${OIDC_ISSUER}/.well-known/jwks.json`,
    cache: true,
    rateLimit: true
}) : null;

function getKey(header, callback) {
    if (!jwksClient) return callback(new Error('JWKS Client not initialized'));
    jwksClient.getSigningKey(header.kid, (err, key) => {
        if (err) return callback(err);
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}

/**
 * PPOS Federated Identity Middleware (Hardened 19.B.1)
 * 
 * Hierarchy of Trust:
 * 1. OIDC Federated Token (Primary)
 * 2. Local JWT (Transitional/Legacy)
 * 3. Admin API Key (Automation Restricted)
 */
const requireAuth = (roles = []) => {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.cookies?.ppos_token;
        const apiKey = req.headers['x-admin-api-key'];

        // Path 1: OIDC / Local JWT Detection
        if (token) {
            try {
                // Peek at the token to see issuer
                const decodedUnverified = jwt.decode(token);
                const isFederated = decodedUnverified && decodedUnverified.iss === OIDC_ISSUER;

                let decoded;
                if (isFederated && jwksClient) {
                    // VERIFY AGAINST OIDC PROVIDER (JWKS)
                    decoded = await new Promise((resolve, reject) => {
                        jwt.verify(token, getKey, { 
                            issuer: OIDC_ISSUER, 
                            audience: OIDC_AUDIENCE 
                        }, (err, res) => {
                            if (err) reject(err);
                            else resolve(res);
                        });
                    });
                } else {
                    // VERIFY AGAINST LOCAL SECRET (TRANSITIONAL)
                    if (process.env.NODE_ENV === 'production' && !isFederated) {
                        console.warn('[AUTH] Blocking non-federated token in production');
                        throw new Error('Federated Identity Required');
                    }
                    decoded = jwt.verify(token, JWT_SECRET, { audience: 'ppos:control' });
                }

                req.operator = {
                    id: decoded.sub || decoded.email,
                    name: decoded.name || decoded.preferred_username || decoded.sub,
                    role: mapClaimsToRole(decoded),
                    auth_method: isFederated ? 'oidc' : 'jwt',
                    iss: decoded.iss
                };

                // RBAC Check
                if (roles.length > 0 && !roles.includes(req.operator.role) && req.operator.role !== 'super-admin') {
                    return res.status(403).json({ 
                        error: 'Insufficient Privileges',
                        code: 'INSUFFICIENT_ROLE',
                        required: roles
                    });
                }

                return next();
            } catch (err) {
                console.error('[AUTH-ERROR] Token validation failed:', err.message);
                return res.status(401).json({ 
                    error: 'Invalid or Expired Token',
                    code: 'INVALID_TOKEN'
                });
            }
        }

        // Path 2: Transitional Admin API Key (Strictly for non-human automation)
        if (apiKey && apiKey === process.env.ADMIN_API_KEY) {
            // Enforcement: If we are in 19.B, we restrict API keys to specific automation paths
            // For now, allow all but log warning
            console.log(`[AUTH] API-Key access allowed for: ${req.method} ${req.path}`);
            
            req.operator = {
                id: 'system',
                name: 'System Account (API Key)',
                role: 'super-admin', // Automation often needs high privilege
                auth_method: 'api-key'
            };
            return next();
        }

        return res.status(401).json({ 
            error: 'Authentication Required',
            code: 'AUTH_REQUIRED',
            hint: 'Provide a federated OIDC token'
        });
    };
};

/**
 * Map OIDC claims/groups to internal roles
 */
function mapClaimsToRole(decoded) {
    // Priority: Explicit role in token, then groups/claims mapping
    if (decoded.role) return decoded.role;
    
    const groups = decoded.groups || decoded['https://printprice.pro/roles'] || [];
    if (groups.includes('ppos-super-admins')) return 'super-admin';
    if (groups.includes('ppos-platform-admins')) return 'admin';
    if (groups.includes('ppos-ops-leads')) return 'operator';
    
    return 'viewer'; // Default lowest privilege
}

module.exports = {
    requireAuth,
    JWT_SECRET
};
