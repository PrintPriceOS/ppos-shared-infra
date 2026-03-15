import fs from 'node:fs';
import path from 'node:path';

export function createWorkspaceRoot(rootPath: string) {
    const directories = [
        rootPath,
        path.join(rootPath, 'repos'),
        path.join(rootPath, 'registry'),
        path.join(rootPath, 'registry', 'execution_runs'),
        path.join(rootPath, 'registry', 'evidence'),
        path.join(rootPath, 'registry', 'reports'),
        path.join(rootPath, 'registry', 'issue_publication')
    ];

    for (const dir of directories) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return { rootPath, directoriesCreated: directories };
}
