const mysql = require('mysql2/promise');
const SecretManager = require('../ops/SecretManager');

// 1. Resolve Connection URL (Environment > SecretManager)
const dbUrl = process.env.DATABASE_URL || SecretManager.get('DATABASE_URL');

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
};

// Diagnostic Trace (Phase 8)
console.log(`[SHARED-DB-INIT] DATABASE_URL set: ${!!dbUrl} | Host: ${process.env.MYSQL_HOST || 'ppos-mysql (default)'}`);

const pool = dbUrl ? mysql.createPool(dbUrl) : mysql.createPool(dbConfig);

// Bridge for code expecting .rows (Postgres style) while using MySql
const originalQuery = pool.query;
pool.query = async function(...args) {
    const [results, fields] = await originalQuery.apply(pool, args);
    if (results && Array.isArray(results)) {
        results.rows = results;
    }
    return results;
};

module.exports = pool;
