import { StoryExecutionUnit } from '@ppos/build-program-core';

export type RepositoryIssuePack = {
    repoId: string;
    waveIds: string[];
    epicIds: string[];
    capabilityIds: string[];
    stories: StoryExecutionUnit[];
};

export type PublicationRecord = {
    publicationId: string;
    targetId: string;
    provider: 'linear' | 'jira' | 'github' | 'local';
    repoId: string;
    storyIds: string[];
    createdAt: string;
    status: 'pending' | 'published' | 'partial' | 'failed';
    warnings?: string[];
    errors?: string[];
};

export type IssueTraceRecord = {
    localStoryId: string;
    externalIssueId?: string;
    provider: 'linear' | 'jira' | 'github' | 'local';
    repoId: string;
    epicId?: string;
    syncedAt: string;
};
