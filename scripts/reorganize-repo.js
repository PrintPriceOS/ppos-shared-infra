const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = process.cwd();

const folders = [
    'app', 'frontend', 'config', 'docs', 'reports', 'scripts', 'tests', 'assets', 'workspace'
];

// 1. Create Directories
folders.forEach(f => {
    const p = path.join(root, f);
    if (!fs.existsSync(p)) {
        fs.mkdirSync(p, { recursive: true });
        console.log(`Created: ${f}`);
    }
});

const move = (src, dest) => {
    const srcPath = path.join(root, src);
    const destPath = path.join(root, dest);
    if (fs.existsSync(srcPath)) {
        try {
            // Using shell move to handle directories/files consistently
            if (process.platform === 'win32') {
                execSync(`move "${srcPath}" "${destPath}"`);
            } else {
                execSync(`mv "${srcPath}" "${destPath}"`);
            }
            console.log(`Moved: ${src} -> ${dest}`);
        } catch (e) {
            console.error(`Failed to move ${src}: ${e.message}`);
        }
    }
};

// 2. Reorganize Files & Folders

// Move to reports/
[
    'FINAL_LEGACY_CLEANUP_REPORT.md',
    'INITIAL_QUARRY_CLEANUP_REPORT.md',
    'STAGING_VALIDATION_REPORT.md',
    'PRODUCT_OS_MIGRATION_COMPLETE.md',
    'QUARRY_CLEANUP_MAP.md',
    'INITIAL_QUARRY_CLEANUP_REPORT.md', // just in case
    'SHARED_INFRA_WORKSPACE_RECONCILIATION.md'
].forEach(f => move(f, path.join('reports', f)));

// Move to docs/
[
    'PRINTPRICE_MASTER_ARCHITECTURE_V1.9.md',
    'PRODUCT_OS_DEPLOYMENT_CONFIG.md',
    'ARCHITECTURE.md',
    'SETUP.md',
    'API.md',
    'DEVELOPMENT.md'
].forEach(f => move(f, path.join('docs', f)));

// Move to scripts/
[
    'scan_env.js',
    'check_config.js',
    'temp_val.js',
    'refine-packages.js'
].forEach(f => move(f, path.join('scripts', f)));

// Move to assets/
const assetDirs = ['stress_test_pdfs', 'test_suite_pdfs'];
assetDirs.forEach(d => move(d, 'assets/'));
[
    'test.pdf',
    'mock.pdf'
].forEach(f => move(f, path.join('assets', f)));

// Move to workspace/
move('PrintPriceOS_Workspace', 'workspace/');

// Move to config/
[
    '.env.example',
    'tsconfig.json',
    'types.ts'
].forEach(f => move(f, path.join('config', f)));

// Move to frontend/
const frontDirs = ['pages', 'public'];
frontDirs.forEach(d => move(d, 'frontend/'));
[
    'workflow.css',
    'vite.config.ts'
].forEach(f => move(f, path.join('frontend', f)));

// Move to app/
// Careful: server.js and main subdirs
const appItems = [
    'routes',
    'services',
    'utils',
    'utils-server',
    'server.js',
    'worker_guardrails_test.js'
];
appItems.forEach(i => move(i, 'app/'));

// 3. Update package.json
const pkgPath = path.join(root, 'package.json');
if (fs.existsSync(pkgPath)) {
    let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.main = 'app/server.js';
    if (pkg.scripts) {
        if (pkg.scripts.start) pkg.scripts.start = 'node app/server.js';
        if (pkg.scripts.dev) pkg.scripts.dev = 'vite frontend'; // Adjusting for vite if it can take a root
    }
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log('Updated package.json');
}

console.log('\nREORGANIZATION COMPLETE.');
