export function applyRepoClassTemplate(repoId: string, repoClass: string) {
    return {
        repoId,
        repoClass,
        rootFiles: [
            'README.md',
            'OWNERSHIP.md',
            'ARCHITECTURE.md',
            'package.json'
        ],
        docs: ['docs/overview.md'],
        workflows: ['.github/workflows/ci.yml'],
        packages: []
    };
}
