export function buildBlockerViews(items: any[]) {
    return items
        .filter((item) => item.state === 'blocked' || item.blocking)
        .map((item) => ({
            targetId: item.repoId || item.storyId || item.targetId,
            targetType: item.repoId ? 'repo' : item.storyId ? 'story' : 'gate',
            reason: item.blockingReasons || item.explanation || 'Unknown blocker',
            severity: item.priority === 'P0' ? 'critical' : 'warning'
        }));
}
