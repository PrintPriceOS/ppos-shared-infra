export async function publishIssuePack(pack: any, adapter: any) {
    return {
        packId: pack.packId,
        adapterId: adapter.adapterId,
        status: 'published',
        publishedIssueCount: pack.stories.length,
        timestamp: new Date().toISOString()
    };
}
