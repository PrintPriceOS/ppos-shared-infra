export const BUILD_PROGRAM_STATES = [
    'defined',
    'resolved',
    'bootstrapped',
    'provisioned',
    'hydrated',
    'published',
    'executable',
    'verified',
    'promotable',
    'blocked',
    'invalid',
    'rollback_required'
] as const;

export type BuildProgramState = typeof BUILD_PROGRAM_STATES[number];
