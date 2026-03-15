import type { BuildPhaseId } from './BuildPhaseDefinition';

export type BuildProfile = {
    profileId: string;
    name: string;
    description: string;
    targetRepoIds: string[];
    executionMode: 'human' | 'agent' | 'hybrid';
    allowedPhases: BuildPhaseId[];
    ciBaselineRequired: boolean;
    strictGovernance: boolean;
    publicationMode: 'local' | 'external' | 'hybrid';
};
