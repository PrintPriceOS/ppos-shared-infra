export function generateReadinessSummary(report: any) {
    return {
        phase: 'readiness',
        programId: report.programId,
        promotable: report.promotable,
        failedHardGates: report.failedGateIds.length,
        timestamp: new Date().toISOString()
    };
}
