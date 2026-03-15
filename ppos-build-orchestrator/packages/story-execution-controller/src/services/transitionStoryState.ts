import type { StoryExecutionState, StoryExecutionUnit } from '@ppos/build-program-core';

export function transitionStoryState(story: StoryExecutionUnit, newState: StoryExecutionState) {
    const oldState = story.state;
    return {
        storyId: story.storyId,
        oldState,
        newState,
        valid: true,
        timestamp: new Date().toISOString()
    };
}
