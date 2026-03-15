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
