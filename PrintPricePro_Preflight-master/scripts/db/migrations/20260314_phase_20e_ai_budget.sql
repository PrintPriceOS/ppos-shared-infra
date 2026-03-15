-- Phase 20.E: AI Budget Governance Extension
-- Date: 2026-03-14

-- 1. Extend tenant_resource_limits with more granular AI fields
ALTER TABLE tenant_resource_limits
ADD COLUMN max_ai_tokens_per_minute BIGINT NOT NULL DEFAULT 0 AFTER max_jobs_per_hour,
ADD COLUMN max_ai_concurrent_jobs INT NOT NULL DEFAULT 0 AFTER max_ai_cost_per_hour,
ADD COLUMN ai_model_tier VARCHAR(50) NOT NULL DEFAULT 'standard' AFTER max_ai_concurrent_jobs;

-- 2. Initial values for trial/standard/enterprise tiers (Conceptual for reference)
-- UPDATE tenant_resource_limits SET max_ai_tokens_per_minute = 10000, max_ai_tokens_per_hour = 100000, max_ai_tokens_per_day = 1000000, max_ai_cost_per_day = 5.0000, max_ai_concurrent_jobs = 1, ai_model_tier = 'standard' WHERE plan_tier = 'standard';
