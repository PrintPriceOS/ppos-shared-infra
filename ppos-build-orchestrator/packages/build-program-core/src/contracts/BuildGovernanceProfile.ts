import { BuildPhaseDefinition } from './BuildPhaseDefinition';

export interface BuildGovernanceProfile {
    profileId: string;
    name: string;
    phases: BuildPhaseDefinition[];
    requireEvidence?: string[];
    enforceHardGates?: boolean;
}

export { BuildPhaseDefinition };
