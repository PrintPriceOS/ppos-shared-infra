export const REPO_BUILD_STATES = [
    'pending',
    'scaffolded',
    'hydrated',
    'ci_ready',
    'issue_bound',
    'execution_ready',
    'verified',
    'blocked'
] as const;

export type RepositoryBuildState = typeof REPO_BUILD_STATES[number];
