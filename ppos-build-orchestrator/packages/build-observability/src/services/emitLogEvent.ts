export function emitLogEvent(event: {
    level: 'info' | 'warn' | 'error' | 'debug';
    category: string;
    message: string;
    metadata?: Record<string, any>;
}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${event.level.toUpperCase()}] [${event.category}] ${event.message}`);
    return { ...event, timestamp };
}
