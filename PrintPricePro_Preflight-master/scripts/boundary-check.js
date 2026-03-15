#!/usr/bin/env node

/**
 * scripts/boundary-check.js
 * 
 * Boundary Enforcement Automation - Phase 18.C.2
 * Fails the build if monolithic/legacy residue is detected.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const SRC_DIRS = ['services', 'routes', 'middleware', 'components', 'pages', 'utils-server', 'workers', 'security', 'lib'];

const FORBIDDEN_PATTERNS = [
    { pattern: /require\(.*ppos-preflight-engine.*\)/, message: 'Direct import of platform engine' },
    { pattern: /spawn\(.*['"]gs['"]/, message: 'Local Ghostscript execution' },
    { pattern: /spawn\(.*['"]pdfimages['"]/, message: 'Local Poppler execution' },
    { pattern: /spawn\(.*['"]qpdf['"]/, message: 'Local QPDF execution' },
    { pattern: /require\(.*bullmq.*\)/, message: 'Local Queue management detected' },
    { pattern: /new Worker\(.*\)/, message: 'Local Worker ownership detected' }
];

let errors = [];

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    FORBIDDEN_PATTERNS.forEach(rule => {
        if (rule.pattern.test(content)) {
            errors.push(`[BOUNDARY-VIOLATION] ${filePath}: ${rule.message}`);
        }
    });
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                walk(fullPath);
            }
        } else if (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
            checkFile(fullPath);
        }
    });
}

console.log('[BOOTSTRAP] Starting Boundary Enforcement Check...');

try {
    SRC_DIRS.forEach(dir => {
        const fullPath = path.join(PROJECT_ROOT, dir);
        if (fs.existsSync(fullPath)) walk(fullPath);
    });

    // Check server.js specifically
    checkFile(path.join(PROJECT_ROOT, 'server.js'));

    if (errors.length > 0) {
        console.error('\n❌ BOUNDARY CHECK FAILED');
        errors.forEach(err => console.error(err));
        process.exit(1);
    } else {
        console.log('\n✅ BOUNDARY CHECK PASSED: No forbidden monolith residue detected.');
        process.exit(0);
    }
} catch (err) {
    console.error('[FATAL] Boundary check infra failed:', err.message);
    process.exit(1);
}
