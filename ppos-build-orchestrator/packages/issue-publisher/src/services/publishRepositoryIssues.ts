import { resolveRepositoryIssuePack } from '../resolvers/resolveRepositoryIssuePack';
import { resolveIssueTargetAdapter } from '../resolvers/resolveIssueTargetAdapter';
import { publishIssuePack } from './publishIssuePack';

export async function publishRepositoryIssues(input: {
    repoId: string;
    stories: any[];
    mode: 'local' | 'external' | 'hybrid';
}) {
    const pack = resolveRepositoryIssuePack(input.repoId, input.stories);
    const adapter = resolveIssueTargetAdapter(input.mode);
    const result = await publishIssuePack(pack, adapter);

    return {
        repoId: input.repoId,
        result,
        valid: true
    };
}
