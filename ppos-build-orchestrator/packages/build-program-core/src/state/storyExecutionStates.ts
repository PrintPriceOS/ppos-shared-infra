export const STORY_EXECUTION_STATES = [
    'planned',
    'dependency_cleared',
    'ready',
    'assigned',
    'in_progress',
    'implementation_submitted',
    'review_pending',
    'verified',
    'done',
    'blocked',
    'rework_required',
    'rejected'
] as const;

export type StoryExecutionState = typeof STORY_EXECUTION_STATES[number];
