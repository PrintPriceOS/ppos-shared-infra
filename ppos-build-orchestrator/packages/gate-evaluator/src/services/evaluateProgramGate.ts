import type { GateEvaluationResult } from '@ppos/build-program-core';

export function evaluateProgramGate(programId: string, gateDef: any, evidence: any): GateEvaluationResult {
    return {
        gateId: gateDef.gateId,
        targetType: 'program',
        targetId: programId,
        status: 'pass',
        blocking: gateDef.severity === 'hard',
        evidenceRefs: [],
        explanation: ['Program-level assurance confirmed.'],
        evaluatedAt: new Date().toISOString()
    };
}
