const express = require('express');
const router = express.Router();
const GovernanceService = require('../services/governanceService');
const { requireAuth } = require('../middleware/auth');

// Note: requireAuth() already extracts 'operator' from JWT/API-Key

router.post('/tenant/quarantine', requireAuth(['admin', 'super-admin']), async (req, res) => {
    try {
        const { tenantId, reason } = req.body;
        if (!tenantId || !reason) return res.status(400).json({ error: 'Tenant ID and Reason required' });
        
        const result = await GovernanceService.quarantineTenant(tenantId, req.operator, reason);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/tenant/pardon', requireAuth(['admin', 'super-admin']), async (req, res) => {
    try {
        const { tenantId, reason } = req.body;
        if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
        
        const result = await GovernanceService.pardonTenant(tenantId, req.operator, reason || 'Restored by admin');
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/queue/state', requireAuth(['operator', 'admin', 'super-admin']), async (req, res) => {
    try {
        const { queueName, state, reason } = req.body;
        if (!queueName || !state || !reason) return res.status(400).json({ error: 'QueueName, State, and Reason required' });
        
        const result = await GovernanceService.setQueueState(queueName, req.operator, state, reason);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/audit-logs', requireAuth(), async (req, res) => {
    try {
        const logs = await GovernanceService.getAuditLogs();
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/policies', requireAuth(), async (req, res) => {
    try {
        const policies = await GovernanceService.getActivePolicies();
        res.json(policies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SLO Monitoring (Phase 21.D) ---

router.get('/slo/status', requireAuth(['operator', 'admin', 'super-admin']), async (req, res) => {
    try {
        const status = await GovernanceService.getSLOStatus();
        res.json(status);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/slo/history', requireAuth(['operator', 'admin', 'super-admin']), async (req, res) => {
    try {
        const history = await GovernanceService.getSLOHistory();
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Resource Governance Analytics (Phase 20.F) ---
const ResourceAdmin = require('../services/resourceGovernanceAdminService');

router.get('/resources/overview', requireAuth(['operator', 'admin', 'super-admin']), async (req, res) => {
    try {
        const overview = await ResourceAdmin.getGlobalOverview();
        res.json(overview);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/resources/tenants', requireAuth(['operator', 'admin', 'super-admin']), async (req, res) => {
    try {
        const tenants = await ResourceAdmin.getTenantsUsage();
        res.json(tenants);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/resources/tenant/:id', requireAuth(['operator', 'admin', 'super-admin']), async (req, res) => {
    try {
        const detail = await ResourceAdmin.getTenantDetail(req.params.id);
        res.json(detail);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Destructive Endpoints (19.B.2) ---

router.post('/queue/flush', requireAuth(['super-admin']), async (req, res) => {
    try {
        const { queueType, reason } = req.body;
        if (!queueType || !reason) return res.status(400).json({ error: 'QueueType and Reason required' });
        
        const result = await GovernanceService.flushQueue(queueType, req.operator, reason);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/history/purge', requireAuth(['super-admin']), async (req, res) => {
    try {
        const { days, reason } = req.body;
        if (!days || !reason) return res.status(400).json({ error: 'Retention Period (days) and Reason required' });
        
        const result = await GovernanceService.purgeJobHistory(days, req.operator, reason);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
