/**
 * Build Execution Run
 * 
 * Represents a single execution instance of a build program.
 */

export type BuildExecutionRun = {
    runId: string;
    profileId: string;
    programId: string;
    workspaceId: string;
    startedAt: string;
    finishedAt?: string;
    phase: 'resolve' | 'bootstrap' | 'provision' | 'verify';
    status: 'running' | 'completed' | 'failed';
    repoIds: string[];
};
