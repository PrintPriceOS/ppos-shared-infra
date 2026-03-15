-- Phase 23.A: Printer Capability Registry Schema
-- Date: 2026-03-14

-- 1. Printer Nodes: The physical or virtual entities that producer jobs
CREATE TABLE IF NOT EXISTS printer_nodes (
  id VARCHAR(36) PRIMARY KEY,
  printer_code VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  country_code VARCHAR(10) DEFAULT 'US',
  region VARCHAR(100),
  city VARCHAR(100),
  timezone VARCHAR(100) DEFAULT 'UTC',

  status VARCHAR(30) NOT NULL DEFAULT 'active', -- active | degraded | suspended | offline
  connector_type VARCHAR(30) NOT NULL DEFAULT 'pull_agent', -- pull_agent | push_api | manual_bridge
  api_base_url VARCHAR(500),
  heartbeat_url VARCHAR(500),

  sla_tier VARCHAR(50) DEFAULT 'standard', -- standard, high, critical
  trust_level VARCHAR(50) DEFAULT 'verified', -- guest, verified, partner
  priority_weight INT DEFAULT 1,

  max_daily_capacity INT DEFAULT 0,
  max_concurrent_jobs INT DEFAULT 0,
  
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Capabilities Registry: Structured technical abilities
CREATE TABLE IF NOT EXISTS printer_capabilities (
  id VARCHAR(36) PRIMARY KEY,
  printer_id VARCHAR(36) NOT NULL,
  capability_type VARCHAR(100) NOT NULL,   -- paper, format, binding, color, finishing
  capability_key VARCHAR(100) NOT NULL,
  capability_value VARCHAR(255) NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (printer_id) REFERENCES printer_nodes(id) ON DELETE CASCADE,
  INDEX idx_printer_cap_type (capability_type, capability_key)
);

-- 3. Runtime Status: High-frequency availability data
CREATE TABLE IF NOT EXISTS printer_runtime_status (
  id VARCHAR(36) PRIMARY KEY,
  printer_id VARCHAR(36) NOT NULL UNIQUE,
  heartbeat_at TIMESTAMP NULL,
  availability_state VARCHAR(30) NOT NULL DEFAULT 'offline', -- available | busy | degraded | offline
  queue_depth INT DEFAULT 0,
  estimated_start_delay_minutes INT DEFAULT 0,
  current_load_percent DECIMAL(5,2) DEFAULT 0.00,
  failure_rate_24h DECIMAL(5,2) DEFAULT 0.00,
  acceptance_rate_24h DECIMAL(5,2) DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (printer_id) REFERENCES printer_nodes(id) ON DELETE CASCADE
);

-- 4. Printer Credentials: Secure connectivity
CREATE TABLE IF NOT EXISTS printer_credentials (
  id VARCHAR(36) PRIMARY KEY,
  printer_id VARCHAR(36) NOT NULL,
  credential_type VARCHAR(50) NOT NULL, -- api_key | jwt | mtls
  key_id VARCHAR(255) NOT NULL,
  secret_hash VARCHAR(500) NOT NULL,
  last_rotated_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  status VARCHAR(30) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (printer_id) REFERENCES printer_nodes(id) ON DELETE CASCADE,
  UNIQUE KEY (key_id)
);

-- 5. Production Ledger: Centralized Federated State tracking (Phase 23.E Preview)
CREATE TABLE IF NOT EXISTS production_state_events (
  id VARCHAR(36) PRIMARY KEY,
  job_id VARCHAR(255) NOT NULL,
  printer_id VARCHAR(36),
  previous_state VARCHAR(50),
  new_state VARCHAR(50) NOT NULL,
  source VARCHAR(50) NOT NULL, -- system | printer_agent | operator | webhook
  reason TEXT,
  payload JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_prod_job (job_id),
  INDEX idx_prod_printer (printer_id)
);
