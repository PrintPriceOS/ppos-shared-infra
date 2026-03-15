-- 01_core_registry.sql
CREATE TABLE IF NOT EXISTS canonical_job_registry (
    job_id VARCHAR(255) PRIMARY KEY,
    current_stage ENUM('INGESTED', 'PREFLIGHTING', 'PRICING', 'MATCHMAKING', 'DISPATCHED', 'NODE_ACCEPTED', 'IN_PRODUCTION', 'SHIPPED', 'FAILED', 'REFUNDED') NOT NULL,
    trace_id VARCHAR(255),
    workflow_id VARCHAR(255),
    workflow_run_id VARCHAR(255),
    customer_tier ENUM('STANDARD', 'PREMIUM', 'ENTERPRISE') DEFAULT 'STANDARD',
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    sla_deadline DATETIME(3),
    INDEX idx_trace (trace_id),
    INDEX idx_stage (current_stage)
);
