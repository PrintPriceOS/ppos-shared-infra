-- 02_events_ledger.sql
CREATE TABLE IF NOT EXISTS job_events_ledger (
    event_id CHAR(36) PRIMARY KEY,
    job_id VARCHAR(255) NOT NULL,
    trace_id VARCHAR(255),
    previous_stage VARCHAR(50),
    new_stage VARCHAR(50) NOT NULL,
    trigger_activity VARCHAR(100),
    event_payload JSON,
    event_timestamp TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_job (job_id),
    INDEX idx_trace (trace_id)
);
