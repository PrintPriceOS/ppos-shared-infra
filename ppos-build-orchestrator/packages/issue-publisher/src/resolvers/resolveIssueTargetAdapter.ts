export function resolveIssueTargetAdapter(mode: 'local' | 'external' | 'hybrid') {
    return {
        targetMode: mode,
        adapterId: mode === 'local' ? 'local-filesystem-adapter' : 'external-api-adapter',
        capabilities: ['create', 'update', 'link']
    };
}
