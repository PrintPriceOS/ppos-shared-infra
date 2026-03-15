-- Migration: Performance Optimizations

-- 1. Optimizing Job Orquestration (Phase 22.E.1)
-- Speeds up BullMQ discovery and scheduler logic
CREATE INDEX idx_jobs_scheduler ON jobs (status, created_at, type);
CREATE INDEX idx_jobs_tenant_status ON jobs (tenant_id, status);

-- 2. Optimizing Governance Audit (Phase 22.E.2)
-- Crucial for SLO Evaluation and Dashboard performance
-- governance_audit often filters by action_type + created_at
CREATE INDEX idx_audit_action_created ON governance_audit (action_type, created_at);
CREATE INDEX idx_audit_tenant_action ON governance_audit (tenant_id, action_type);
CREATE INDEX idx_audit_target ON governance_audit (target_type, target_id);

-- 3. Optimizing Resource Usage Materialization (Phase 22.E.3)
CREATE INDEX idx_usage_tenant_period ON tenant_resource_usage (tenant_id, period_type, period_start);
