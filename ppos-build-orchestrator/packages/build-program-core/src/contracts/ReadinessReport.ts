// ReadinessReport.ts
export type GateEvaluationResult = any;

export type RepoReadinessReport = {
    repoId: string;
    priority: 'P0' | 'P1' | 'P2';
    gates: GateEvaluationResult[];
    evidenceBundleIds: string[];
    promotable: boolean;
    blockingReasons: string[];
    generatedAt: string;
};

export type ProgramPromotionReport = {
    programId: string;
    evaluatedAt: string;
    repoReports: RepoReadinessReport[];
    failedGateIds: string[];
    promotable: boolean;
    explanation: string[];
};
