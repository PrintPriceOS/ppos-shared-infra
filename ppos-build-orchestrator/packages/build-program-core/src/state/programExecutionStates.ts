export const PROGRAM_EXECUTION_STATES = [
    'defined',
    'resolving',
    'bootstrapping',
    'provisioning',
    'hydrating',
    'ci_activating',
    'issue_publishing',
    'preparing_execution',
    'executing',
    'verifying',
    'promoting',
    'promoted',
    'failed'
] as const;

export type ProgramExecutionState = typeof PROGRAM_EXECUTION_STATES[number];
