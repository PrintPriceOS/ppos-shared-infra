import type { AssuranceSummary } from '@ppos/build-program-core';

export function generateAssuranceSummary(assuranceData: any): AssuranceSummary {
    return {
        programId: assuranceData.programId,
        promotable: assuranceData.promotable,
        totalGateEvaluations: assuranceData.totalGateEvaluations,
        failedHardGates: assuranceData.failedHardGates,
        missingEvidenceTypes: assuranceData.missingEvidenceTypes || [],
        p0ReposVerified: assuranceData.p0ReposVerified,
        p0ReposTotal: assuranceData.p0ReposTotal,
        explanation: assuranceData.explanation || [],
        generatedAt: new Date().toISOString()
    };
}
