export function generateProgramRiskReport(programId: string, risks: any[]) {
    return {
        programId,
        riskScore: risks.reduce((sum, r) => sum + (r.impact * r.probability), 0),
        categories: ['integrity', 'timeline', 'governance'],
        activeRisks: risks.filter(r => r.status === 'active'),
        mitigatedRisks: risks.filter(r => r.status === 'mitigated'),
        generatedAt: new Date().toISOString()
    };
}
