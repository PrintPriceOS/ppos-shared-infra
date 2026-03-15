import { recordOperatorIntervention } from './recordOperatorIntervention';

export function requestRunRerun(input: {
    programId: string;
    runId: string;
    operatorId: string;
    notes: string;
}) {
    return recordOperatorIntervention({
        programId: input.programId,
        targetType: 'run',
        targetId: input.runId,
        operatorId: input.operatorId,
        action: 'rerun_request',
        notes: input.notes
    });
}
