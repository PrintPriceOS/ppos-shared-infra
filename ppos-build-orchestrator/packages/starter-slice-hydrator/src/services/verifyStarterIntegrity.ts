import fs from 'node:fs';
import path from 'node:path';

export function verifyStarterIntegrity(repoPath: string, requiredFiles: string[]) {
    const missingFiles = requiredFiles.filter((rel) => !fs.existsSync(path.join(repoPath, rel)));

    return {
        repoId: path.basename(repoPath),
        starterSliceId: 'resolved-at-runtime',
        requiredFilesPresent: missingFiles.length === 0,
        missingFiles,
        unexpectedConflicts: [],
        valid: missingFiles.length === 0,
        warnings: [],
        generatedAt: new Date().toISOString()
    };
}
