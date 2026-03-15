import type { BuildProgram, StoryExecutionUnit } from '@ppos/build-program-core';
import { OperatorInterventionRecord } from '@ppos/build-program-core';

export class ManagedOperations {
    private interventions: OperatorInterventionRecord[] = [];

    recordIntervention(intervention: OperatorInterventionRecord) {
        this.interventions.push(intervention);
        return intervention;
    }

    getInterventionsForTarget(targetId: string) {
        return this.interventions.filter(i => i.targetId === targetId);
    }
}
