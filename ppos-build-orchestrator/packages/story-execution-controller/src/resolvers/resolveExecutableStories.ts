import type { StoryExecutionUnit } from '@ppos/build-program-core';
import { resolveStoryDependencies } from './resolveStoryDependencies';

export function resolveExecutableStories(stories: StoryExecutionUnit[]) {
    const deps = resolveStoryDependencies(stories);

    return stories.filter((story) => {
        const depStatus = deps.resolutions.find((d) => d.targetStoryId === story.storyId);
        return depStatus && depStatus.resolved && story.state !== 'done';
    });
}
