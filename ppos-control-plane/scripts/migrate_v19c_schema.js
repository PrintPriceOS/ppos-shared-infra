const db = require('../src/services/db');

async function migrate() {
    console.log('[MIGRATE] Standardizing governance_policies schema...');
    console.log('[DEBUG] DB_URL:', (process.env.DATABASE_URL || 'NOT_FOUND').substring(0, 20) + '...');

    const dropTable = `DROP TABLE IF EXISTS governance_policies;`;
    
    const createTable = `
        CREATE TABLE governance_policies (
            id VARCHAR(36) PRIMARY KEY,
            policy_type VARCHAR(100) NOT NULL,
            scope_type VARCHAR(50) NOT NULL,      -- global | tenant | queue | service
            scope_id VARCHAR(255) NULL,           -- tenant_id, queue_name, service_name o null
            action VARCHAR(100) NOT NULL,         -- deny | allow | quarantine | degrade | throttle
            status VARCHAR(30) NOT NULL DEFAULT 'active',
            reason TEXT,
            config JSON NULL,
            created_by VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
    `;

    try {
        await db.query(dropTable);
        await db.query(createTable);
        console.log('[SUCCESS] governance_policies table re-created with standard schema.');
        
        // Seed an initial "Global Execution Halt" policy as disabled (inactive)
        const seedSql = `
            INSERT INTO governance_policies (id, policy_type, scope_type, scope_id, action, status, reason, created_by)
            VALUES (UUID(), 'GLOBAL_EXECUTION_HALT', 'global', NULL, 'deny', 'inactive', 'Initial System Safety Valve', 'system')
        `;
        await db.query(seedSql);
        console.log('[SUCCESS] Seeded inactive global halt policy.');

    } catch (err) {
        console.error('[ERROR] Migration failed!');
        console.error('Full Error:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
        process.exit(1);
    }
}

migrate().then(() => process.exit(0));
