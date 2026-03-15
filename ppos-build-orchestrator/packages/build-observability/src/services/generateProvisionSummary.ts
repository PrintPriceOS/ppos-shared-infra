export function generateProvisionSummary(results: any[]) {
    return {
        phase: 'provision',
        totalRepos: results.length,
        successfulRepos: results.filter(r => r.created).length,
        failedRepos: results.filter(r => !r.created).length,
        timestamp: new Date().toISOString()
    };
}
