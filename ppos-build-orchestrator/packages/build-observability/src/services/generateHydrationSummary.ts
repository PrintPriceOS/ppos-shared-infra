export function generateHydrationSummary(results: any[]) {
    return {
        phase: 'hydration',
        totalRepos: results.length,
        successfulRepos: results.filter(r => r.valid).length,
        failedRepos: results.filter(r => !r.valid).length,
        timestamp: new Date().toISOString()
    };
}
