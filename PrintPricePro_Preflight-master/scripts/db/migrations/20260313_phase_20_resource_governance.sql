-- Phase 20: Multi-Tenant Resource Governance Schema
-- Date: 2026-03-13

-- 1. Configuration Table: Limits by Tenant
CREATE TABLE IF NOT EXISTS tenant_resource_limits (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL UNIQUE,
  plan_tier VARCHAR(50) NOT NULL DEFAULT 'standard', -- trial, standard, enterprise
  priority_class VARCHAR(50) NOT NULL DEFAULT 'normal', -- low, normal, high, critical

  -- Concurrency & Throughput
  max_concurrent_jobs INT NOT NULL DEFAULT 2,
  max_jobs_per_minute INT NOT NULL DEFAULT 30,
  max_jobs_per_hour INT NOT NULL DEFAULT 500,
  max_queue_depth INT NOT NULL DEFAULT 100,

  -- AI Governance (Phase 20.E)
  max_ai_tokens_per_day BIGINT NOT NULL DEFAULT 0,
  max_ai_tokens_per_hour BIGINT NOT NULL DEFAULT 0,
  max_ai_cost_per_day DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
  max_ai_cost_per_hour DECIMAL(12,4) NOT NULL DEFAULT 0.0000,

  -- System Resources
  max_storage_mb INT NOT NULL DEFAULT 1024,
  max_cpu_seconds_per_hour INT NOT NULL DEFAULT 3600,

  -- Burst Protection
  burst_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.50,
  burst_window_seconds INT NOT NULL DEFAULT 60,

  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Snapshot Table: Historical resource usage for reporting and billing
CREATE TABLE IF NOT EXISTS tenant_resource_usage (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  period_type ENUM('minute', 'hour', 'day') NOT NULL,
  period_start TIMESTAMP NOT NULL,

  jobs_enqueued INT NOT NULL DEFAULT 0,
  jobs_started INT NOT NULL DEFAULT 0,
  jobs_completed INT NOT NULL DEFAULT 0,
  jobs_failed INT NOT NULL DEFAULT 0,

  ai_tokens_used BIGINT NOT NULL DEFAULT 0,
  ai_cost_used DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
  cpu_seconds_used DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  storage_mb_used DECIMAL(12,2) NOT NULL DEFAULT 0.00,

  queue_depth_peak INT NOT NULL DEFAULT 0,
  concurrency_peak INT NOT NULL DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY (tenant_id, period_type, period_start)
);

-- 3. Overrides Table: Temporary capacity boosts or emergency caps
CREATE TABLE IF NOT EXISTS tenant_resource_overrides (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  override_type VARCHAR(100) NOT NULL, -- temporary_boost, emergency_cap, promotion_access
  config JSON NOT NULL, -- JSON object containing keys from tenant_resource_limits to override
  expires_at TIMESTAMP NULL,
  created_by VARCHAR(255) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Initial Seed for default plans (Conceptual)
-- Note: Real logic will resolve based on Plan Tier if no specific tenant entry exists.
