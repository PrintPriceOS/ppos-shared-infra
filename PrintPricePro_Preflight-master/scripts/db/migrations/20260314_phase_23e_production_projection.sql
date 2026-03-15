-- Phase 23.E: Production State Projection
-- Date: 2026-03-14

-- This table provides a flattened view of the current production status
CREATE TABLE IF NOT EXISTS production_current_state (
  dispatch_id VARCHAR(36) PRIMARY KEY,
  job_id VARCHAR(255) NOT NULL,
  printer_id VARCHAR(36) NOT NULL,
  
  current_state VARCHAR(50) NOT NULL,
  state_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  last_source VARCHAR(50) NOT NULL, -- printer_agent | system | operator
  
  metadata JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (dispatch_id) REFERENCES federated_dispatches(id) ON DELETE CASCADE,
  INDEX idx_curr_job (job_id),
  INDEX idx_curr_printer (printer_id),
  INDEX idx_curr_status (current_state)
);
