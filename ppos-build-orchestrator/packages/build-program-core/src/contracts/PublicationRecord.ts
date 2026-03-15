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
