import { recordOperatorIntervention } from './recordOperatorIntervention';

export function attachManualEvidence(input: {
    programId: string;
    targetId: string;
    operatorId: string;
    notes: string;
    targetType: 'story' | 'repo' | 'program';
}) {
    return recordOperatorIntervention({
        programId: input.programId,
        targetType: input.targetType,
        targetId: input.targetId,
        operatorId: input.operatorId,
        action: 'manual_evidence',
        notes: input.notes
    });
}
