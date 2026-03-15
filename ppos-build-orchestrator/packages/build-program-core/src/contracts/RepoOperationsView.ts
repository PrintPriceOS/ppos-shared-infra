export type RepoOperationsView = {
    repoId: string;
    priority: 'P0' | 'P1' | 'P2';
    state: string;
    ciReady: boolean;
    issueBound: boolean;
    executionReady: boolean;
    promotable: boolean;
    blockingReasons: string[];
    failedGateIds: string[];
    generatedAt: string;
};
