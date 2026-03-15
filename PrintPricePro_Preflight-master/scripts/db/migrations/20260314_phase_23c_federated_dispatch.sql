-- Phase 23.C: Federated Dispatch & Offers
-- Date: 2026-03-14

CREATE TABLE IF NOT EXISTS federated_dispatches (
  id VARCHAR(36) PRIMARY KEY,
  job_id VARCHAR(255) NOT NULL,
  printer_id VARCHAR(36) NOT NULL,
  
  -- offered | accepted | rejected | expired | failed | completed (Phase 23.E)
  dispatch_status VARCHAR(50) NOT NULL DEFAULT 'offered', 
  
  score DECIMAL(10,2),
  score_trace JSON,
  
  offer_expires_at TIMESTAMP NULL,
  accepted_at TIMESTAMP NULL,
  rejected_at TIMESTAMP NULL,
  expired_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  
  failure_reason TEXT,
  metadata JSON,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (printer_id) REFERENCES printer_nodes(id) ON DELETE CASCADE,
  INDEX idx_fed_job (job_id),
  INDEX idx_fed_printer (printer_id),
  INDEX idx_fed_status (dispatch_status),
  INDEX idx_fed_expiry (offer_expires_at)
);
