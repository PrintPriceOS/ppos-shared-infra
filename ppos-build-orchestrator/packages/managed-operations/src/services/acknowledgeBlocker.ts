import { recordOperatorIntervention } from './recordOperatorIntervention';

export function acknowledgeBlocker(input: {
    programId: string;
    blockerId: string;
    operatorId: string;
    notes: string;
    targetType: 'story' | 'repo' | 'program';
}) {
    return recordOperatorIntervention({
        programId: input.programId,
        targetType: input.targetType,
        targetId: input.blockerId,
        operatorId: input.operatorId,
        action: 'acknowledge',
        notes: input.notes
    });
}
