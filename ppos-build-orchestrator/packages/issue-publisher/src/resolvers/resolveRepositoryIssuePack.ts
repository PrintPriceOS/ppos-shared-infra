import type { StoryExecutionUnit } from '@ppos/build-program-core';

export function resolveRepositoryIssuePack(repoId: string, stories: StoryExecutionUnit[]) {
    return {
        repoId,
        stories: stories.filter((s) => s.repoId === repoId),
        packId: `pack.${repoId}.${Date.now()}`,
        generatedAt: new Date().toISOString()
    };
}
