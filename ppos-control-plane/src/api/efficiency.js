// ppos-control-plane/src/api/efficiency.js
const express = require('express');
const router = express.Router();
const EfficiencyMetricsService = require('../services/efficiencyMetricsService');

/**
 * @route GET /api/efficiency/overview
 * @desc Get unified executive dashboard for platform efficiency
 */
router.get('/overview', async (req, res) => {
    try {
        const overview = await EfficiencyMetricsService.getOverview();
        res.json(overview);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch efficiency overview', message: err.message });
    }
});

/**
 * @route GET /api/efficiency/ai
 * @desc Deep dive into AI Economic impact
 */
router.get('/ai', async (req, res) => {
    try {
        const ai = await EfficiencyMetricsService.getAIEconomics();
        res.json(ai);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch AI economics', message: err.message });
    }
});

/**
 * @route GET /api/efficiency/runtime
 * @desc Compute and worker efficiency metrics
 */
router.get('/runtime', async (req, res) => {
    try {
        const runtime = await EfficiencyMetricsService.getRuntimeEfficiency();
        res.json(runtime);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch runtime efficiency', message: err.message });
    }
});

module.exports = router;
