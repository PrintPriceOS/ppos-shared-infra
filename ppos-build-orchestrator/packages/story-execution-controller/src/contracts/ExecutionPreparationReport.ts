export type DependencyResolution = {
    targetStoryId: string;
    dependencyIds: string[];
    unresolvedDependencyIds: string[];
    resolved: boolean;
    evaluatedAt: string;
};

export type ExecutionBatch = {
    batchId: string;
    programId: string;
    storyIds: string[];
    repoIds: string[];
    executionMode: 'human' | 'agent' | 'hybrid';
    createdAt: string;
};

export type ExecutionPreparationReport = {
    programId: string;
    generatedAt: string;
    repoReports: {
        repoId: string;
        totalStories: number;
        publishedStories: number;
        readyStories: number;
        blockedStories: number;
    }[];
    executableStoryIds: string[];
    batchIds: string[];
    valid: boolean;
    blockingReasons: string[];
};
