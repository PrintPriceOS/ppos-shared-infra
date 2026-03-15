export type ProgramOperationsView = {
    programId: string;
    profileId: string;
    state: string;
    promotable: boolean;
    totalRepos: number;
    promotableRepos: number;
    blockedRepos: number;
    totalStories: number;
    readyStories: number;
    blockedStories: number;
    failedHardGates: number;
    activeRunId?: string;
    generatedAt: string;
};

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

export type OperatorInterventionRecord = {
    interventionId: string;
    programId: string;
    targetType: 'program' | 'repo' | 'story' | 'run' | 'gate';
    targetId: string;
    operatorId: string;
    actionType:
    | 'acknowledge_blocker'
    | 'add_note'
    | 'request_rerun'
    | 'attach_manual_evidence'
    | 'escalate'
    | 'reopen_evaluation';
    rationale: string;
    createdAt: string;
};
