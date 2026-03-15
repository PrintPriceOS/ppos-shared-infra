
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const dirs = fs.readdirSync(root).filter(f => fs.statSync(path.join(root, f)).isDirectory());

const expectedFiles = ['package.json', 'README.md', '.gitignore'];
const repos = [
  'ppos-build-orchestrator',
  'ppos-control-plane',
  'ppos-core-platform',
  'ppos-governance-assurance',
  'ppos-preflight-engine',
  'ppos-preflight-service',
  'ppos-preflight-worker',
  'ppos-printer-agent',
  'ppos-shared-contracts',
  'ppos-shared-infra',
  'PrintPricePro_Preflight-master'
];

const results = {};

repos.forEach(repo => {
  const repoPath = path.join(root, repo);
  if (!fs.existsSync(repoPath)) {
    results[repo] = 'MISSING';
    return;
  }
  
  const files = fs.readdirSync(repoPath);
  const status = {
    exists: true,
    missingFiles: expectedFiles.filter(f => !files.includes(f)),
    hasSrc: files.includes('src') || files.includes('packages') || files.includes('engine') || files.includes('server.js'),
    isGit: files.includes('.git')
  };
  results[repo] = status;
});

console.log(JSON.stringify(results, null, 2));
