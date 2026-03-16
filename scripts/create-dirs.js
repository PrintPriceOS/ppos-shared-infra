const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'ppos-build-orchestrator');
const subDirs = [
    'packages',
    'docs',
    'registry',
    'tests',
    '.github/workflows'
];

if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir);
}

subDirs.forEach(dir => {
    const fullPath = path.join(baseDir, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

console.log('Created directories for ppos-build-orchestrator.');
