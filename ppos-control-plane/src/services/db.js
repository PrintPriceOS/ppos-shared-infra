const mysql = require('mysql2/promise');
const path = require('path');
const envPath = path.resolve(__dirname, '../../../.env');
console.log('[DB] Loading env from:', envPath);
require('dotenv').config({ path: envPath }); 

const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = {
    query: (sql, params) => pool.query(sql, params).then(([rows]) => ({ rows }))
};
