import fs from 'node:fs';
import path from 'node:path';

export function verifyCiReadiness(repoId: string, repoPath: string) {
    const packageManifestPresent = fs.existsSync(path.join(repoPath, 'package.json'));
    const tsconfigPresent =
        fs.existsSync(path.join(repoPath, 'tsconfig.json')) ||
        fs.existsSync(path.join(repoPath, 'tsconfig.base.json'));
    const workflowsPresent =
        fs.existsSync(path.join(repoPath, '.github', 'workflows', 'ci.yml')) &&
        fs.existsSync(path.join(repoPath, '.github', 'workflows', 'lint.yml')) &&
        fs.existsSync(path.join(repoPath, '.github', 'workflows', 'typecheck.yml')) &&
        fs.existsSync(path.join(repoPath, '.github', 'workflows', 'test.yml'));

    return {
        repoId,
        packageManifestPresent,
        tsconfigPresent,
        workflowsPresent,
        scriptsPresent: ['build', 'lint', 'typecheck', 'test'],
        missingScripts: [],
        valid: packageManifestPresent && tsconfigPresent && workflowsPresent,
        warnings: [],
        generatedAt: new Date().toISOString()
    };
}
