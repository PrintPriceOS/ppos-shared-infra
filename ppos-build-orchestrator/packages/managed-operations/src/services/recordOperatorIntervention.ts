import type { OperatorInterventionRecord } from '@ppos/build-program-core';

export function recordOperatorIntervention(input: Omit<OperatorInterventionRecord, 'interventionId' | 'timestamp'>): OperatorInterventionRecord {
    return {
        interventionId: `intv.${Date.now()}`,
        ...input,
        timestamp: new Date().toISOString()
    };
}
