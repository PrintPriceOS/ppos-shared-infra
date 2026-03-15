export function generateRunTimelineReport(runId: string, events: any[]) {
    return {
        runId,
        startTime: events[0]?.timestamp,
        endTime: events[events.length - 1]?.timestamp,
        eventCount: events.length,
        milestones: events.filter(e => e.metadata?.isMilestone),
        generatedAt: new Date().toISOString()
    };
}
