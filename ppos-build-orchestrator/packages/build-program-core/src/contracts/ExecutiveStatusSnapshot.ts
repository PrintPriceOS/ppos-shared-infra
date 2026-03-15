export type ExecutiveStatusSnapshot = {
    programId: string;
    state: string;
    promotable: boolean;
    totalRepos: number;
    reposAtRisk: number;
    totalStories: number;
    readyStories: number;
    blockedStories: number;
    failedHardGates: number;
    topRisks: string[];
    generatedAt: string;
};
