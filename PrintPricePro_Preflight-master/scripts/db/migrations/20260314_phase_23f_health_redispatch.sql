-- Phase 23.F: Network Health & Redispatch
-- Date: 2026-03-14

-- 1. Extend Federated Dispatches for Retry Tracking
ALTER TABLE federated_dispatches 
ADD COLUMN attempt_number INT DEFAULT 1,
ADD COLUMN parent_dispatch_id VARCHAR(36) NULL,
ADD INDEX idx_fed_parent (parent_dispatch_id);

-- 2. SLA Events: Tracking health and threshold breaches
CREATE TABLE IF NOT EXISTS printer_sla_events (
  id VARCHAR(36) PRIMARY KEY,
  printer_id VARCHAR(36) NOT NULL,
  dispatch_id VARCHAR(36) NULL,
  
  -- heartbeat_missed | sla_breach | breaker_open | redispatch | quality_alert
  event_type VARCHAR(100) NOT NULL, 
  severity VARCHAR(30) NOT NULL, -- info | warning | critical
  
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (printer_id) REFERENCES printer_nodes(id) ON DELETE CASCADE,
  INDEX idx_sla_printer (printer_id),
  INDEX idx_sla_type (event_type)
);

-- 3. Redispatch Attempts: Lifecycle of job recovery
CREATE TABLE IF NOT EXISTS redispatch_attempts (
  id VARCHAR(36) PRIMARY KEY,
  job_id VARCHAR(255) NOT NULL,
  failed_dispatch_id VARCHAR(36),
  previous_printer_id VARCHAR(36),
  
  reason_code VARCHAR(100) NOT NULL,
  attempt_number INT NOT NULL,
  
  -- queued | matched | skipped | blocked | completed
  status VARCHAR(50) NOT NULL DEFAULT 'queued', 
  
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_rd_job (job_id),
  INDEX idx_rd_status (status)
);
