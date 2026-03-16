
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const repos = [
  'ppos-build-orchestrator',
  'ppos-control-plane',
  'ppos-core-platform',
  'ppos-governance-assurance',
  'ppos-preflight-engine',
  'ppos-preflight-service',
  'ppos-preflight-worker',
  'ppos-shared-contracts',
  'ppos-shared-infra',
  'PrintPricePro_Preflight-master'
];

const deps = {};

repos.forEach(repo => {
  const pkgPath = path.join(root, repo, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    deps[repo] = {
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
      engines: pkg.engines || {}
    };
  } else {
    deps[repo] = 'MISSING package.json';
  }
});

console.log(JSON.stringify(deps, null, 2));
