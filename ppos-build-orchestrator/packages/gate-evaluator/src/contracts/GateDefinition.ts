export type GateDefinition = {
    gateId: string;
    targetType: 'story' | 'repo' | 'wave' | 'program';
    category:
    | 'structure'
    | 'hydration'
    | 'ci'
    | 'publication'
    | 'readiness'
    | 'governance';
    severity: 'hard' | 'soft';
    description: string;
    requiredEvidenceTypes: string[];
    blockingOnFail: boolean;
};

export type GateEvaluationResult = {
    gateId: string;
    targetId: string;
    status: 'pass' | 'fail' | 'warn' | 'unknown';
    passed: boolean;
    blocking: boolean;
    explanation: string[];
    evaluatedAt: string;
};
