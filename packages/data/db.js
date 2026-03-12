const mysql = require('mysql2/promise');

let pool;
try {
    const dbUrl = process.env.DATABASE_URL;
    const fallbackUrl = 'mysql://root@localhost:3306/preflight_dev';

    pool = mysql.createPool({
        uri: dbUrl || fallbackUrl,
        connectionLimit: 20,
        waitForConnections: true,
        enableKeepAlive: true,
        charset: 'utf8mb4',
        timezone: 'Z'
    });

    pool.getConnection().then((conn) => {
        console.log('[SHARED-INFRA][DB-READY] Connected to MySQL');
        conn.release();
    }).catch(err => {
        console.error('[SHARED-INFRA][DB-ERROR] connection failed:', err.message);
    });

} catch (e) {
    console.error('[SHARED-INFRA][DB-CRITICAL] Failed to initialize DB Pool:', e.message);
}

module.exports = {
    query: async (text, params) => {
        if (!pool) return Promise.reject(new Error('DB not initialized'));
        const mysqlQuery = text.replace(/\$\d+/g, '?');
        const [rows] = await pool.query(mysqlQuery, params);
        return { rows };
    },
    checkConnection: async () => {
        if (!pool) return false;
        try {
            const [rows] = await pool.query('SELECT 1 as ok');
            return rows && rows[0] && rows[0].ok === 1;
        } catch (e) {
            return false;
        }
    },
    pool,
};
