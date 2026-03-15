export interface OperatorInterventionRecord {
    interventionId: string;
    programId: string;
    targetType: 'story' | 'repo' | 'program' | 'gate' | 'run';
    targetId: string;
    operatorId: string;
    action: 'acknowledge' | 'override' | 'manual_evidence' | 'rerun_request';
    notes: string;
    timestamp: string;
}
