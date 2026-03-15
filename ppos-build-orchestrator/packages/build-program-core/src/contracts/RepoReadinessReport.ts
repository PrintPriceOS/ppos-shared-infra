import type { GateEvaluationResult } from './GateEvaluationResult';

export type RepoReadinessReport = {
    repoId: string;
    priority: 'P0' | 'P1' | 'P2';
    state: string;
    gates: GateEvaluationResult[];
    evidenceBundleIds: string[];
    promotable: boolean;
    blockingReasons: string[];
    generatedAt: string;
};
