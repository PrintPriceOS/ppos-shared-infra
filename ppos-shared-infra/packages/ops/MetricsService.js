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
            buckets: [0.1, 1, 5, 15, 30, 60, 120, 300]
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
