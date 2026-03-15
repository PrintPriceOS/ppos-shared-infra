import { ExecutionPreparationReport, DependencyResolution, ExecutionBatch } from '@ppos/contracts/ExecutionPreparationReport';
import { StoryExecutionUnit } from '@ppos/build-program-core';

export function generateExecutionPreparationReport(input: {
    programId: string;
    repoPacks: any[];
    resolutions: DependencyResolution[];
    executableStories: StoryExecutionUnit[];
    batches: ExecutionBatch[];
}): ExecutionPreparationReport {
    const { programId, repoPacks, resolutions, executableStories, batches } = input;

    const repoReports = repoPacks.map(pack => {
        const repoResolutions = resolutions.filter(r =>
            pack.stories.some((s: any) => s.issueId === r.targetStoryId)
        );

        return {
            repoId: pack.repoId,
            totalStories: pack.stories.length,
            publishedStories: pack.stories.length, // In local mode, all are "published"
            readyStories: repoResolutions.filter(r => r.resolved).length,
            blockedStories: repoResolutions.filter(r => !r.resolved).length
        };
    });

    return {
        programId,
        generatedAt: new Date().toISOString(),
        repoReports,
        executableStoryIds: executableStories.map(s => s.storyId),
        batchIds: batches.map(b => b.batchId),
        valid: repoReports.every(r => r.totalStories > 0),
        blockingReasons: []
    };
}
