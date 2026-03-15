import { createWorkspaceRoot } from './createWorkspaceRoot';

export function bootstrapWorkspace(workspacePath: string) {
    const result = createWorkspaceRoot(workspacePath);
    return {
        valid: true,
        workspacePath,
        directoriesCreated: result.directoriesCreated
    };
}
