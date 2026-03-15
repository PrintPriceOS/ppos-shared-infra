const express = require('express');
const router = express.Router();
const MetricsService = require('../services/metricsService');

router.get('/overview', async (req, res) => {
    try {
        const { range } = req.query;
        const stats = await MetricsService.getGlobalOverview(range);
        res.json(stats);
    } catch (err) {
        console.error('[API-METRICS-OVERVIEW]', err);
        res.status(500).json({ error: 'Failed to fetch overview metrics' });
    }
});

router.get('/jobs/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit || 20);
        const jobs = await MetricsService.getRecentJobs(limit);
        res.json(jobs);
    } catch (err) {
        console.error('[API-METRICS-JOBS]', err);
        res.status(500).json({ error: 'Failed to fetch recent jobs' });
    }
});

router.get('/tenants/summary', async (req, res) => {
    try {
        const summary = await MetricsService.getTenantsSummary();
        res.json(summary);
    } catch (err) {
        console.error('[API-METRICS-TENANTS]', err);
        res.status(500).json({ error: 'Failed to fetch tenants summary' });
    }
});

router.get('/governance', async (req, res) => {
    try {
        const { range } = req.query;
        const metrics = await MetricsService.getGovernanceMetrics(range);
        res.json(metrics);
    } catch (err) {
        console.error('[API-METRICS-GOVERNANCE]', err);
        res.status(500).json({ error: 'Failed to fetch governance metrics' });
    }
});

module.exports = router;
