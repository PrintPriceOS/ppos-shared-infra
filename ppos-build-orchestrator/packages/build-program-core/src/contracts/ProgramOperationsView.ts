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
