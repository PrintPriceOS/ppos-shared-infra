import { provisionRepository } from './provisionRepository';

export function provisionRepositories(input: {
    repositories: Array<{ repoId: string; repoClass: string }>;
    workspaceReposRoot: string;
}) {
    return input.repositories.map((repo) =>
        provisionRepository({
            repoId: repo.repoId,
            repoClass: repo.repoClass,
            workspaceReposRoot: input.workspaceReposRoot
        })
    );
}
