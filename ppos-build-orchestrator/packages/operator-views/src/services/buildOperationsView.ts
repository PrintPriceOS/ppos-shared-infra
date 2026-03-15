import {
    ProgramOperationsView,
    RepoOperationsView,
    OperatorInterventionRecord
} from '../contracts/OperatorOperations';

export function buildProgramOperationsView(programData: any): ProgramOperationsView {
    return {
        programId: programData.programId,
        profileId: programData.profileId,
        state: programData.state,
        promotable: programData.promotable,
        totalRepos: programData.repoReports?.length || 0,
        promotableRepos: programData.repoReports?.filter((r: any) => r.promotable).length || 0,
        blockedRepos: programData.repoReports?.filter((r: any) => !r.promotable).length || 0,
        totalStories: programData.totalStories || 0,
        readyStories: programData.readyStories || 0,
        blockedStories: programData.blockedStories || 0,
        failedHardGates: programData.failedGateIds?.length || 0,
        generatedAt: new Date().toISOString()
    };
}

export function buildRepoOperationsView(repoReport: any): RepoOperationsView {
    return {
        repoId: repoReport.repoId,
        priority: repoReport.priority,
        state: repoReport.state || 'unknown',
        ciReady: repoReport.gates?.some((g: any) => g.gateId === 'ci_baseline_gate' && g.status === 'pass'),
        issueBound: repoReport.gates?.some((g: any) => g.gateId === 'issue_publication_gate' && g.status === 'pass'),
        executionReady: repoReport.promotable,
        promotable: repoReport.promotable,
        blockingReasons: repoReport.blockingReasons || [],
        failedGateIds: repoReport.gates?.filter((g: any) => g.status === 'fail').map((g: any) => g.gateId) || [],
        generatedAt: new Date().toISOString()
    };
}

export function buildBlockerViews(repoReports: any[]): any[] {
    const blockers: any[] = [];
    repoReports.forEach(repo => {
        repo.gates?.filter((g: any) => g.status === 'fail').forEach((g: any) => {
            blockers.push({
                blockerId: `blk-${repo.repoId}-${g.gateId}`,
                targetType: 'repo',
                targetId: repo.repoId,
                severity: g.blocking ? 'high' : 'medium',
                category: g.category || 'unknown',
                summary: g.explanation.join('; '),
                createdAt: g.evaluatedAt,
                acknowledged: false,
                escalated: false
            });
        });
    });
    return blockers;
}

export function recordOperatorIntervention(input: Omit<OperatorInterventionRecord, 'interventionId' | 'createdAt'>): OperatorInterventionRecord {
    return {
        ...input,
        interventionId: `int-${Date.now()}`,
        createdAt: new Date().toISOString()
    };
}
