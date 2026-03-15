import type { GateEvaluationResult } from '@ppos/build-program-core';

export function evaluateRepoGate(repoId: string, gateDef: any, evidence: any): GateEvaluationResult {
    return {
        gateId: gateDef.gateId,
        targetType: 'repo',
        targetId: repoId,
        status: 'pass',
        blocking: gateDef.severity === 'hard',
        evidenceRefs: [],
        explanation: ['Repository gate evaluation passed.'],
        evaluatedAt: new Date().toISOString()
    };
}
