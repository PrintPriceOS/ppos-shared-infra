import { recordOperatorIntervention } from './recordOperatorIntervention';

export function reopenReadinessEvaluation(input: {
    programId: string;
    repoId: string;
    operatorId: string;
    notes: string;
}) {
    return recordOperatorIntervention({
        programId: input.programId,
        targetType: 'repo',
        targetId: input.repoId,
        operatorId: input.operatorId,
        action: 'override',
        notes: input.notes
    });
}
