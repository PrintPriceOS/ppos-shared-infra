// ppos-governance-assurance/src/audit/IDPersistenceTest.ts
export async function verifyIDPersistence(db: any, testJobId: string): Promise<boolean> {
    console.log(`[Audit] Verifying ID Persistence for ${testJobId}`);

    const [registry]: any = await db.query(
        'SELECT trace_id, workflow_id, workflow_run_id FROM canonical_job_registry WHERE job_id = ?',
        [testJobId]
    );

    if (!registry || registry.length === 0) {
        console.error(`[Audit] FAIL: Job ${testJobId} not found in Registry`);
        return false;
    }

    const { trace_id, workflow_id } = registry[0];
    console.log(`[Audit] Found TraceID: ${trace_id} | WorkflowID: ${workflow_id}`);

    const [ledger]: any = await db.query(
        'SELECT event_id FROM job_events_ledger WHERE job_id = ? AND trace_id = ?',
        [testJobId, trace_id]
    );

    if (ledger.length === 0) {
        console.error(`[Audit] FAIL: No entries in Ledger with matching TraceID`);
        return false;
    }

    const [shadow]: any = await db.query(
        'SELECT id, is_divergent FROM shadow_routing_log WHERE global_job_id = ? AND trace_id = ?',
        [testJobId, trace_id]
    );

    if (shadow.length === 0) {
        console.warn(`[Audit] WARN: No Shadow Log entry found for ${testJobId}.`);
    } else {
        console.log(`[Audit] SUCCESS: Shadow Log entry found with matching TraceID. Divergence: ${shadow[0].is_divergent}`);
    }

    return true;
}
