export function printRunSummary(summary: Record<string, unknown>) {
    console.log(JSON.stringify(summary, null, 2));
}
