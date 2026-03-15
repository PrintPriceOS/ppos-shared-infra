import type { IssueTraceRecord } from '@ppos/build-program-core';

export function createIssueTraceRecords(repoId: string, stories: any[], results: any): IssueTraceRecord[] {
    return stories.map((s) => ({
        localStoryId: s.storyId,
        externalIssueId: `EXT-${s.storyId}`,
        provider: 'local',
        repoId,
        syncedAt: new Date().toISOString()
    }));
}
