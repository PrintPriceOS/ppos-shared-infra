import type { StoryExecutionUnit } from '@ppos/build-program-core';

export function resolveStoryDependencies(stories: StoryExecutionUnit[]) {
    const resolvedStoryIds = stories.filter(s => s.state === 'done').map(s => s.storyId);

    const resolutions = stories.map((story) => {
        const dependencies = story.dependencies || [];
        const unresolved = dependencies.filter(id => !resolvedStoryIds.includes(id));

        return {
            targetStoryId: story.storyId,
            resolved: unresolved.length === 0,
            unresolvedDependencies: unresolved
        };
    });

    const isStoryReady = (story: StoryExecutionUnit) => {
        const res = resolutions.find(r => r.targetStoryId === story.storyId);
        return res && res.resolved && story.state !== 'blocked';
    };

    return {
        resolutions,
        readyStoryIds: stories.filter(isStoryReady).map(s => s.storyId)
    };
}
