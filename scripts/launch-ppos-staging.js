/**
 * PPOS Staging Launcher
 * 
 * Boots the minimal hardened stack for V1.9.2 validation.
 */
const { spawn } = require('child_process');
const path = require('path');

const SERVICES = [
    {
        name: 'PREFLIGHT-SERVICE',
        dir: 'workspace/PrintPriceOS_Workspace/ppos-preflight-service',
        script: 'server.js',
        env: { PPOS_SERVICE_PORT: '8001', ADMIN_API_KEY: 'test-key' }
    },
    {
        name: 'PREFLIGHT-WORKER',
        dir: 'workspace/PrintPriceOS_Workspace/ppos-preflight-worker',
        script: 'worker.js',
        env: { HEALTH_PORT: '8002', REDIS_HOST: '127.0.0.1' }
    },
    {
        name: 'CONTROL-PLANE',
        dir: 'workspace/PrintPriceOS_Workspace/ppos-control-plane',
        script: 'server.js',
        env: { PPOS_CONTROL_PORT: '8080', PPOS_CONTROL_TOKEN: 'admin-secret' }
    }
];

console.log('🏗 Starting PPOS Staging Stack...');

SERVICES.forEach(svc => {
    console.log(`🚀 Launching ${svc.name}...`);
    const child = spawn('node', [svc.script], {
        cwd: path.resolve(__dirname, '..', svc.dir),
        env: { ...process.env, ...svc.env }
    });

    child.stdout.on('data', (data) => {
        console.log(`[${svc.name}] ${data.toString().trim()}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`[${svc.name}-ERROR] ${data.toString().trim()}`);
    });

    child.on('error', (err) => {
        console.error(`❌ Failed to start ${svc.name}:`, err.message);
    });

    child.on('exit', (code) => {
        console.log(`[${svc.name}] Process exited with code ${code}`);
    });
});

// Keep process alive
setInterval(() => {}, 1000);

console.log('\n📡 Services are booting. Run "node tests/staging_prov_run.js" in a few seconds.');
