export const STATE_TRANSITION_RULES = [
    { entityType: 'program', from: 'defined', to: 'resolved', allowed: true },
    { entityType: 'program', from: 'resolved', to: 'bootstrapped', allowed: true },
    { entityType: 'program', from: 'bootstrapped', to: 'provisioned', allowed: true },
    { entityType: 'repo', from: 'pending', to: 'scaffolded', allowed: true },
    { entityType: 'repo', from: 'scaffolded', to: 'hydrated', allowed: true },
    { entityType: 'story', from: 'planned', to: 'dependency_cleared', allowed: true },
    { entityType: 'story', from: 'dependency_cleared', to: 'ready', allowed: true }
] as const;
