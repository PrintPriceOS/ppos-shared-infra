import { ExecutiveStatusSnapshot, AssuranceSummary } from '@ppos/contracts/ReportingContracts';

export function generateExecutiveStatusSnapshot(programView: any, blockerViews: any[]): ExecutiveStatusSnapshot {
    return {
        programId: programView.programId,
        state: programView.state,
        promotable: programView.promotable,
        totalRepos: programView.totalRepos,
        reposAtRisk: programView.blockedRepos,
        totalStories: programView.totalStories,
        readyStories: programView.readyStories,
        blockedStories: programView.blockedStories,
        failedHardGates: programView.failedHardGates,
        topRisks: blockerViews.slice(0, 3).map(b => `${b.targetId}: ${b.summary}`),
        generatedAt: new Date().toISOString()
    };
}

export function generateAssuranceSummary(promotionReport: any): AssuranceSummary {
    return {
        programId: promotionReport.programId,
        promotable: promotionReport.promotable,
        totalGateEvaluations: promotionReport.repoReports.flatMap((r: any) => r.gates).length,
        failedHardGates: promotionReport.failedGateIds.length,
        missingEvidenceTypes: [], // Should be linked from evidence view
        p0ReposVerified: promotionReport.repoReports.filter((r: any) => r.priority === 'P0' && r.promotable).length,
        p0ReposTotal: promotionReport.repoReports.filter((r: any) => r.priority === 'P0').length,
        explanation: promotionReport.explanation,
        generatedAt: new Date().toISOString()
    };
}
