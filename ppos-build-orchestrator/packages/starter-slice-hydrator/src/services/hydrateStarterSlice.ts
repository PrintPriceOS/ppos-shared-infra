import fs from 'node:fs';
import path from 'node:path';

export function hydrateStarterSlice(input: {
    repoPath: string;
    files: Array<{ path: string; content: string; required: boolean }>;
}) {
    const filesWritten = [];
    for (const file of input.files) {
        const target = path.join(input.repoPath, file.path);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, file.content, 'utf8');
        filesWritten.push(file.path);
    }

    return {
        repoId: path.basename(input.repoPath),
        starterSliceId: 'resolved-at-runtime',
        filesWritten,
        filesSkipped: [],
        filesMerged: [],
        warnings: [],
        errors: [],
        valid: true
    };
}
