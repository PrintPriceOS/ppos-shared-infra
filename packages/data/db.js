const mysql = require('mysql2/promise');
const SecretManager = require('../ops/SecretManager');

/**
 * Industrial Data Layer - Database Connection Pool
 * Part of R13 H1 (Secrets Hardening)
 */
const db = mysql.createPool({
    host: SecretManager.get('MYSQL_HOST') || 'localhost',
    user: SecretManager.get('MYSQL_USER') || 'ppos_user',
    password: SecretManager.get('MYSQL_PASSWORD') || 'ppos_pass',
    database: SecretManager.get('MYSQL_DATABASE') || 'printprice_os',
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
});

module.exports = db;
