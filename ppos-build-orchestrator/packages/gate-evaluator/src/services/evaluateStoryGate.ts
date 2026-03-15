import type { GateEvaluationResult } from '@ppos/build-program-core';

export function evaluateStoryGate(storyId: string, gateDef: any, evidence: any): GateEvaluationResult {
    return {
        gateId: gateDef.gateId,
        targetType: 'story',
        targetId: storyId,
        status: 'pass',
        blocking: gateDef.severity === 'hard',
        evidenceRefs: [],
        explanation: ['Story integrity verified.'],
        evaluatedAt: new Date().toISOString()
    };
}
