export function resolveStarterSliceBinding(repoId: string, repoClass: string) {
    return {
        repoId,
        repoClass,
        starterSliceId: `starter.${repoClass}.foundation.v1`,
        requiredFiles: ['README.md', 'package.json', 'src/index.ts'],
        requiredPackages: [],
        requiredDocs: ['docs/overview.md'],
        requiredWorkflows: ['.github/workflows/ci.yml']
    };
}
