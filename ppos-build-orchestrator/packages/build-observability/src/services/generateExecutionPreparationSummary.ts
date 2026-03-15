export function generateExecutionPreparationSummary(results: any) {
    return {
        phase: 'execution_preparation',
        totalStories: results.totalStories || 0,
        readyStories: results.readyStories || 0,
        blockedStories: results.blockedStories || 0,
        timestamp: new Date().toISOString()
    };
}
