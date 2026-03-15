-- Phase 23.D: Federated Job Packages
-- Date: 2026-03-14

CREATE TABLE IF NOT EXISTS federated_job_packages (
  id VARCHAR(36) PRIMARY KEY,
  dispatch_id VARCHAR(36) NOT NULL,
  job_id VARCHAR(255) NOT NULL,
  printer_id VARCHAR(36) NOT NULL,
  
  -- preparing | ready | downloaded | received | failed | expired
  package_status VARCHAR(50) NOT NULL DEFAULT 'preparing', 
  
  manifest JSON NOT NULL, -- Full production spec + signed urls
  manifest_hash VARCHAR(128),
  
  expires_at TIMESTAMP NULL,
  downloaded_at TIMESTAMP NULL,
  received_at TIMESTAMP NULL,
  
  failure_reason TEXT,
  metadata JSON,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (dispatch_id) REFERENCES federated_dispatches(id) ON DELETE CASCADE,
  INDEX idx_pkg_dispatch (dispatch_id),
  INDEX idx_pkg_job (job_id),
  INDEX idx_pkg_printer (printer_id),
  INDEX idx_pkg_status (package_status)
);
