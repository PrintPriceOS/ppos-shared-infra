import path from 'node:path';
import { verifyProvisionedRepo } from './verifyProvisionedRepo';

export function verifyProvisionedWorkspace(workspaceReposRoot: string, repoIds: string[]) {
    const repoReports = repoIds.map((repoId) => ({
        repoId,
        ...verifyProvisionedRepo(path.join(workspaceReposRoot, repoId))
    }));

    return {
        valid: repoReports.every((r) => r.valid),
        repoReports,
        blockingReasons: repoReports.filter((r) => !r.valid).map((r) => `Missing required paths in ${r.repoId}`),
        generatedAt: new Date().toISOString()
    };
}
