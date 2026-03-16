const fs = require('fs');
const path = require('path');

const packages = [
    'build-program-core',
    'workspace-bootstrapper',
    'repo-provisioner',
    'starter-slice-hydrator',
    'ci-activation',
    'issue-publisher',
    'story-execution-controller',
    'gate-evaluator',
    'evidence-bundles',
    'build-observability',
    'build-cli'
];

const baseDir = path.join(__dirname, 'ppos-build-orchestrator', 'packages');

packages.forEach(pkg => {
    const pkgDir = path.join(baseDir, pkg);
    const srcDir = path.join(pkgDir, 'src');

    // Define standard subfolders
    const subfolders = ['contracts', 'services', 'state', 'resolvers', 'policies', 'utils'];

    subfolders.forEach(sub => {
        const subPath = path.join(srcDir, sub);
        if (!fs.existsSync(subPath)) {
            fs.mkdirSync(subPath, { recursive: true });
        }
    });

    // Create package-specific README
    const readme = `# @ppos/${pkg}\n\nIndustrial Build Orchestrator package for ${pkg}.\n\n## Responsibilities\n- TODO: Define specific responsibilities for ${pkg}.`;
    fs.writeFileSync(path.join(pkgDir, 'README.md'), readme);

    console.log(`Refined layout for @ppos/${pkg}`);
});

console.log('High-fidelity package scaffolding complete.');
