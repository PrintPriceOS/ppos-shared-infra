import fs from 'node:fs';
import path from 'node:path';
import { applyRepoClassTemplate } from '../resolvers/applyRepoClassTemplate';

export function provisionRepository(input: {
    repoId: string;
    repoClass: string;
    workspaceReposRoot: string;
}) {
    const repoPath = path.join(input.workspaceReposRoot, input.repoId);
    const template = applyRepoClassTemplate(input.repoId, input.repoClass);

    const directories = [
        repoPath,
        path.join(repoPath, 'docs'),
        path.join(repoPath, '.github'),
        path.join(repoPath, '.github', 'workflows')
    ];

    directories.forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

    const files = {
        'README.md': `# ${input.repoId}\n\nProvisioned by V33 bootstrap runtime.\n`,
        'OWNERSHIP.md': `# OWNERSHIP\n\nOwner: PrintPrice OS Platform Engineering\n`,
        'ARCHITECTURE.md': `# ARCHITECTURE\n\nRepo class: ${input.repoClass}\n`,
        'package.json': JSON.stringify({
            name: input.repoId,
            private: true,
            version: '0.1.0'
        }, null, 2) + '\n',
        'docs/overview.md': `# Overview\n\n${input.repoId} overview.\n`,
        '.github/workflows/ci.yml': 'name: CI\non: [push, pull_request]\njobs:\n  placeholder:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo "placeholder"\n'
    };

    Object.entries(files).forEach(([rel, content]) => {
        fs.writeFileSync(path.join(repoPath, rel), content, 'utf8');
    });

    return {
        repoId: input.repoId,
        targetPath: repoPath,
        created: true,
        merged: false,
        filesCreated: Object.keys(files),
        directoriesCreated: directories,
        warnings: [],
        errors: [],
        template
    };
}
