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

export type AssuranceSummary = {
    programId: string;
    promotable: boolean;
    totalGateEvaluations: number;
    failedHardGates: number;
    missingEvidenceTypes: string[];
    p0ReposVerified: number;
    p0ReposTotal: number;
    explanation: string[];
    generatedAt: string;
};
