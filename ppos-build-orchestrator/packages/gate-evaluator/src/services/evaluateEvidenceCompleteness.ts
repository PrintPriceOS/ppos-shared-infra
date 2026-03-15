export function evaluateEvidenceCompleteness(required: string[], provided: string[]) {
    const missing = required.filter((r) => !provided.includes(r));
    return {
        complete: missing.length === 0,
        missing,
        coverage: provided.length / (required.length || 1)
    };
}
