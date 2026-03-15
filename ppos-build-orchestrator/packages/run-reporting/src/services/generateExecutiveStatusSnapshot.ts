import type { ExecutiveStatusSnapshot } from '@ppos/build-program-core';

export function generateExecutiveStatusSnapshot(programData: any): ExecutiveStatusSnapshot {
    return {
        programId: programData.programId,
        state: programData.state,
        promotable: programData.promotable,
        totalRepos: programData.totalRepos,
        reposAtRisk: programData.reposAtRisk,
        totalStories: programData.totalStories,
        readyStories: programData.readyStories,
        blockedStories: programData.blockedStories,
        failedHardGates: programData.failedHardGates,
        topRisks: programData.topRisks || [],
        generatedAt: new Date().toISOString()
    };
}
