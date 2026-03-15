export function recordMetric(metric: {
    name: string;
    value: number;
    unit: string;
    tags?: Record<string, string>;
}) {
    const timestamp = new Date().toISOString();
    // In a real system, this would write to a TSDB or similar.
    return { ...metric, timestamp };
}
