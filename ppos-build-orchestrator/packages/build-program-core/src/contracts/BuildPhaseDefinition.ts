export type BuildPhaseId =
    | 'resolve'
    | 'bootstrap'
    | 'provision'
    | 'hydrate'
    | 'activate_ci'
    | 'publish_issues'
    | 'prepare_execution'
    | 'verify'
    | 'readiness';

export type BuildPhaseDefinition = {
    phaseId: BuildPhaseId;
    order: number;
    description: string;
    required: boolean;
    dependsOn: BuildPhaseId[];
};
