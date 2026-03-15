import type { RepoReadinessReport } from './RepoReadinessReport';

export type ProgramPromotionReport = {
    programId: string;
    evaluatedAt: string;
    repoReports: RepoReadinessReport[];
    failedGateIds: string[];
    promotable: boolean;
    explanation: string[];
};
