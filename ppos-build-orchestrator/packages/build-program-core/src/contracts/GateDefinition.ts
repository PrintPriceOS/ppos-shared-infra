export type GateDefinition = {
    gateId: string;
    targetType: 'story' | 'repo' | 'wave' | 'program';
    severity: 'hard' | 'soft';
    description: string;
    requiredEvidenceTypes: string[];
    blockingOnFail: boolean;
};

export type GateCheckRequest = {
    gateId: string;
    targetType: 'story' | 'repo' | 'wave' | 'program';
    targetId: string;
    evidenceBundleIds?: string[];
    context?: Record<string, string | number | boolean>;
};

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
