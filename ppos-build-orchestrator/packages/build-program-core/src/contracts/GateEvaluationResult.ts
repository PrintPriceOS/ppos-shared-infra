export type GateEvaluationResult = {
    gateId: string;
    targetType: 'story' | 'repo' | 'wave' | 'program';
    targetId: string;
    status: 'pass' | 'fail' | 'warn';
    blocking: boolean;
    evidenceRefs: string[];
    explanation: string[];
    evaluatedAt: string;
};
