import type { BuildProgram, RepoReadinessReport } from '@ppos/build-program-core';

export type GateEvaluationResult = any;

export function generateRepoReadinessReport(
    program: BuildProgram,
    repoId: string,
    gates: GateEvaluationResult[]
): RepoReadinessReport {
    const promotable = gates.every(g => g.passed);

    return {
        repoId,
        state: promotable ? 'ready' : 'evaluating',
        priority: 'P0',
        gates,
        evidenceBundleIds: [],
        promotable,
        blockingReasons: gates.filter(g => !g.passed && g.blocking).map(g => g.explanation),
        generatedAt: new Date().toISOString()
    };
}
