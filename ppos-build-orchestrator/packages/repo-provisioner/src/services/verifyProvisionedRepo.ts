import fs from 'node:fs';
import path from 'node:path';

export function verifyProvisionedRepo(repoPath: string) {
    const required = [
        'README.md',
        'OWNERSHIP.md',
        'ARCHITECTURE.md',
        'package.json',
        'docs/overview.md',
        '.github/workflows/ci.yml'
    ];

    const missingPaths = required.filter((rel) => !fs.existsSync(path.join(repoPath, rel)));

    return {
        valid: missingPaths.length === 0,
        missingPaths,
        warnings: []
    };
}
