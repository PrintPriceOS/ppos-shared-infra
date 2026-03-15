export type IssueTraceRecord = {
    localStoryId: string;
    externalIssueId?: string;
    provider: 'linear' | 'jira' | 'github' | 'local';
    repoId: string;
    epicId?: string;
    syncedAt: string;
};
