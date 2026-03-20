// ppos-shared-infra/packages/ops/MetricsService.js
const client = require('prom-client');

/**
 * MetricsService (Phase R13 - H3)
 * Centralized Prometheus metrics collection and export.
 */
class MetricsService {
    constructor() {
        this.register = client.register;
        
        // Default metrics (CPU, Memory, etc.)
        client.collectDefaultMetrics({ prefix: 'ppos_' });

        // Custom Platform Metrics
        this.jobStatusCounter = new client.Counter({
            name: 'ppos_job_status_total',
            help: 'Total number of jobs by status and operation',
            labelNames: ['operation', 'status', 'tenant_id']
        });

        this.jobLatencySlider = new client.Histogram({
            name: 'ppos_job_latency_seconds',
            help: 'Job processing latency in seconds',
            labelNames: ['operation', 'tenant_id'],
            buckets: [0.1, 0.5, 1, 5, 15, 30, 60, 300, 3600]
        });

        this.fssRelayEvents = new client.Counter({
            name: 'ppos_fss_relay_total',
            help: 'Total FSS relay operations',
            labelNames: ['direction', 'status', 'origin_region', 'destination_region', 'event_name']
        });

        this.fssSecurityViolations = new client.Counter({
            name: 'ppos_fss_security_violations_total',
            help: 'Total FSS security violations detected',
            labelNames: ['region_id', 'violation_type']
        });

        this.queueDepthGauge = new client.Gauge({
            name: 'ppos_queue_depth',
            help: 'Current number of items in the queue',
            labelNames: ['queue_name']
        });

        this.activeWorkersGauge = new client.Gauge({
            name: 'ppos_active_workers',
            help: 'Number of active workers per pool',
            labelNames: ['pool_id']
        });
        
        this.governanceRejections = new client.Counter({
            name: 'ppos_governance_rejections_total',
            help: 'Total governance rejections by reason',
            labelNames: ['reason', 'tenant_id']
        });

        // Federated Runtime Metrics (Phase 24.I)
        this.runtimePolicyDecisions = new client.Counter({
            name: 'ppos_runtime_policy_decisions_total',
            help: 'Total runtime policy decisions by result and mode',
            labelNames: ['action', 'decision', 'mode', 'region_id']
        });

        this.stalenessMetrics = new client.Gauge({
            name: 'ppos_region_sync_lag_seconds',
            help: 'Current regional synchronization lag in seconds',
            labelNames: ['region_id']
        });
    }

    /**
     * Record a successful or failed job
     */
    recordJobResult(operation, status, tenantId, latencyMs) {
        this.jobStatusCounter.inc({ operation, status, tenant_id: tenantId });
        if (latencyMs) {
            this.jobLatencySlider.observe({ operation, tenant_id: tenantId }, latencyMs / 1000);
        }
    }

    /**
     * Update gauge values
     */
    updateQueueDepth(queueName, depth) {
        this.queueDepthGauge.set({ queue_name: queueName }, depth);
    }
    
    updateActiveWorkers(poolId, count) {
        this.activeWorkersGauge.set({ pool_id: poolId }, count);
    }

    recordGovernanceRejection(reason, tenantId) {
        this.governanceRejections.inc({ reason, tenant_id: tenantId });
    }

    recordRuntimeDecision(action, decision, mode, regionId) {
        this.runtimePolicyDecisions.inc({ 
            action, 
            decision: decision ? 'ALLOWED' : 'DENIED', 
            mode, 
            region_id: regionId 
        });
    }

    updateSyncLag(regionId, seconds) {
        this.stalenessMetrics.labels(regionId).set(seconds);
    }

    recordFssRelay(direction, status, origin, destination, eventName) {
        this.fssRelayEvents.labels(direction, status, origin, destination, eventName).inc();
    }

    recordFssViolation(regionId, type) {
        this.fssSecurityViolations.labels(regionId, type).inc();
    }

    /**
     * Export all metrics in Prometheus format
     */
    async getMetrics() {
        return await this.register.metrics();
    }

    get contentType() {
        return this.register.contentType;
    }
}

module.exports = new MetricsService();
