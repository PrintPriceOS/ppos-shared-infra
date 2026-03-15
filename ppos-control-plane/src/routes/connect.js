// routes/connect.js
const express = require('express');
const router = express.Router();
const connectService = require('../../../PrintPricePro_Preflight-master/services/connectService');
const printerRegistry = require('../../../PrintPricePro_Preflight-master/services/printerRegistry');
const capacityService = require('../../../PrintPricePro_Preflight-master/services/capacityService');
const printerAuth = require('../middleware/printerAuth'); // This is local in ppos-core-platform, but connect.js is in ppos-control-plane.
// Wait, connect.js is in ppos-control-plane.
// I moved printerAuth.js to ppos-core-platform.
// So connect.js needs to point to ppos-core-platform's printerAuth.
const auditService = require('../../../PrintPricePro_Preflight-master/services/auditService');
const { requireAuth } = require('../middleware/auth');

// Rate limiting
const rateLimit = require('express-rate-limit');
const onboardingLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { error: 'Too many requests.' } });

/**
 * POST /api/connect/printers
 * Initial printer onboarding. OPEN ENDPOINT (limiters apply).
 */
router.post('/printers', onboardingLimiter, async (req, res) => {
    try {
        const { name, legal_name, vat_id, website, country, city, contact } = req.body;

        if (!name || !legal_name || !country || !city) {
            return res.status(400).json({ error: 'Missing required identity fields.' });
        }

        const result = await connectService.createPrinterNode({
            name, legal_name, vat_id, website, country, city, contact
        });

        await auditService.logAction('system', 'PRINTER_ONBOARDING_INITIATED', {
            ipAddress: req.ip,
            details: { name, country, printer_id: result.id }
        });

        res.status(202).json({
            printer_id: result.id,
            api_key: result.apiKey, // RAW KEY SHARED ONLY ONCE
            status: result.status,
            message: 'Onboarding initiated. Store your API Key securely.',
            links: { self: `/api/connect/printers/${result.id}` }
        });
    } catch (err) {
        console.error('[CONNECT-API]', err);
        res.status(500).json({ error: 'Internal server error during onboarding.' });
    }
});

/**
 * Authenticated Printer Routes
 */
// Point to the canonical printerAuth in ppos-core-platform
const printerAuthMiddleware = require('../../../ppos-core-platform/src/middleware/printerAuth');
router.use('/printers/:id', printerAuthMiddleware);

router.get('/printers/:id', async (req, res) => {
    try {
        const profile = await connectService.getPrinterProfile(req.params.id);
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/printers/:id', async (req, res) => {
    try {
        const result = await connectService.updatePrinterProfile(req.params.id, req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Machines Registry
 */
router.post('/printers/:id/machines', async (req, res) => {
    try {
        const result = await printerRegistry.registerMachine(req.params.id, req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/printers/:id/machines', async (req, res) => {
    try {
        const machines = await printerRegistry.listMachines(req.params.id);
        res.json(machines);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/printers/:id/machines/:machineId', async (req, res) => {
    try {
        // Implementation for status update (OFFLINE/ACTIVE)
        const { status } = req.body;
        // db should be imported or use shared infra
        const db = require('../../../PrintPricePro_Preflight-master/services/db');
        await db.query('UPDATE printer_machines SET status = ? WHERE id = ? AND printer_id = ?', [status, req.params.machineId, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Capacity
 */
router.post('/printers/:id/capacity', async (req, res) => {
    try {
        const { date, total, available, leadTimeDays } = req.body;
        const result = await capacityService.updateCapacity(req.params.id, date, { total, available, leadTimeDays });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/printers/:id/capacity', async (req, res) => {
    try {
        const { start, end } = req.query;
        const capacity = await capacityService.getPrinterCapacity(req.params.id, start, end);
        res.json(capacity);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Status Manual Override (ADMIN ONLY)
 */
router.post('/printers/:id/status', requireAuth(['admin', 'super-admin']), async (req, res) => {
    try {
        const { status } = req.body;
        if (!['ACTIVE', 'OFFLINE'].includes(status)) return res.status(400).json({ error: 'Invalid printer status.' });

        const db = require('../../../PrintPricePro_Preflight-master/services/db');
        await db.query('UPDATE printer_nodes SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
