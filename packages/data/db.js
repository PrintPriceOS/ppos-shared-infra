const mysql = require('mysql2/promise');

/**
 * PrintPrice OS - Shared Infrastructure DB Service
 * Runtime-safe implementation for Docker/K8s (v2.4.124)
 * Standardized for consistent use across Preflight and Workers.
 */

const dbConfig = {
    host: process.env.MYSQL_HOST || 'ppos-mysql',
    user: process.env.MYSQL_USER || 'ppos_user',
    password: process.env.MYSQL_PASSWORD || 'ppos_pass',
    database: process.env.MYSQL_DATABASE || 'printprice_os',
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
};

let pool;

/**
 * Ensures the singleton connection pool is initialized.
 * Uses DATABASE_URL if provided, else falls back to explicit config.
 */
function getPool() {
    if (pool) return pool;

    const dbUrl = process.env.DATABASE_URL;
    
    try {
        if (dbUrl) {
            console.log('[SHARED-DB] Initializing pool from DATABASE_URL');
            pool = mysql.createPool(dbUrl);
        } else {
            console.log('[SHARED-DB] Initializing pool from standard config');
            pool = mysql.createPool(dbConfig);
        }

        // Bridge for code expecting .rows (standardized in Phase 10)
        const originalQuery = pool.query;
        pool.query = async function(...args) {
            const [results] = await originalQuery.apply(pool, args);
            if (results && Array.isArray(results)) {
                results.rows = results;
            }
            return results;
        };

        // Add execute alias for compatibility with code expecting db.execute
        pool.execute = pool.query;

        return pool;
    } catch (err) {
        console.error('[SHARED-DB-ERROR] Failed to initialize MySQL pool:', err.message);
        throw err;
    }
}

// Initialized pool singleton
const initializedPool = getPool();

/**
 * Health check utility
 */
initializedPool.checkConnection = async function() {
    try {
        const [rows] = await this.execute('SELECT 1 as ok');
        return rows && rows[0] && rows[0].ok === 1;
    } catch (err) {
        console.error('[DB-HEALTH-CHECK] Unhealthy:', err.message);
        return false;
    }
};

module.exports = initializedPool;

