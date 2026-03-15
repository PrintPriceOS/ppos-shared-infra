import type { RepositoryBuildTarget, RepoOperationsView } from '@ppos/build-program-core';

export function buildRepoOperationsViews(repos: RepositoryBuildTarget[], states: any[]): RepoOperationsView[] {
    return repos.map((repo) => {
        const state = states.find((s) => s.repoId === repo.repoId) || {};
        return {
            repoId: repo.repoId,
            priority: repo.priority,
            state: state.state || 'pending',
            ciReady: state.ciReady || false,
            issueBound: state.issueBound || false,
            executionReady: state.executionReady || false,
            promotable: state.promotable || false,
            blockingReasons: state.blockingReasons || [],
            failedGateIds: state.failedGateIds || [],
            generatedAt: new Date().toISOString()
        };
    });
}
