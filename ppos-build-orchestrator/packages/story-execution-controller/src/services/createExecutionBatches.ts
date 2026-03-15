import type { StoryExecutionUnit } from '@ppos/build-program-core';

export function createExecutionBatches(stories: StoryExecutionUnit[], batchSize = 5) {
    const batches = [];
    for (let i = 0; i < stories.length; i += batchSize) {
        batches.push(stories.slice(i, i + batchSize));
    }
    return {
        batchCount: batches.length,
        batches,
        generatedAt: new Date().toISOString()
    };
}
