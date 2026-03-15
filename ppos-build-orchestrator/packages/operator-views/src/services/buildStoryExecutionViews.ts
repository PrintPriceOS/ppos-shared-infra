import type { StoryExecutionUnit } from '@ppos/build-program-core';

export function buildStoryExecutionViews(stories: StoryExecutionUnit[]) {
    return stories.map((story) => ({
        storyId: story.storyId,
        repoId: story.repoId,
        state: story.state,
        priority: story.priority,
        executorType: story.executorType,
        dependencyStatus: 'checked'
    }));
}
