
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const envVars = new Set();
const envDetails = {};

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        walk(fullPath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.matchAll(/process\.env\.([A-Z0-9_]+)/g);
      for (const match of matches) {
        envVars.add(match[1]);
        if (!envDetails[match[1]]) envDetails[match[1]] = new Set();
        envDetails[match[1]].add(path.relative(root, fullPath));
      }
    }
  });
}

walk(root);

const sorted = Array.from(envVars).sort();
const output = sorted.map(v => ({
  name: v,
  files: Array.from(envDetails[v]).slice(0, 3) // limit to 3 files
}));

console.log(JSON.stringify(output, null, 2));
