import type { BuildProgram } from '@ppos/build-program-core';

export function resolveWorkspacePlan(program: BuildProgram) {
    return {
        workspaceId: program.workspace.workspaceId,
        targetRepoIds: program.repositories.map((repo) => repo.repoId),
        creationOrder: program.repositories.map((repo) => repo.repoId),
        requiredDirectories: [
            'repos',
            'registry',
            'registry/execution_runs',
            'registry/evidence',
            'registry/reports'
        ],
        validationRules: [
            'all_target_repos_present',
            'required_directories_present',
            'deterministic_creation_order'
        ]
    };
}
