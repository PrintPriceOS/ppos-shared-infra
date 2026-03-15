// ppos-control-plane/src/api/federation.js
const express = require('express');
const router = express.Router();
const { 
    printerRegistryService, 
    dispatchOfferService,
    jobPackageService,
    productionStateService,
    printerHealthService,
    RedispatchService,
    FederatedSLAService,
    federationCockpitService
} = require('@ppos/shared-infra');
const { requirePrinterAuth } = require('../middleware/printerAuth');

/**
 * @route GET /api/federation/printers
 * @desc List all federated printer nodes
 */
router.get('/printers', async (req, res) => {
    try {
        const printers = await printerRegistryService.findPrintersByCapabilities([]);
        res.json(printers);
    } catch (err) {
        res.status(500).json({ error: 'Failed to list printers', message: err.message });
    }
});

/**
 * @route POST /api/federation/printers
 * @desc Register a new printer node
 */
router.post('/printers', async (req, res) => {
    try {
        const result = await printerRegistryService.registerPrinter(req.body);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to register printer', message: err.message });
    }
});

/**
 * @route GET /api/federation/printers/:id
 * @desc Get detailed printer profile (incl. capabilities & runtime)
 */
router.get('/printers/:id', async (req, res) => {
    try {
        const printer = await printerRegistryService.getPrinter(req.params.id);
        if (!printer) return res.status(404).json({ error: 'Printer not found' });
        res.json(printer);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch printer details', message: err.message });
    }
});

/**
 * @route POST /api/federation/printers/:id/capabilities
 * @desc Add a technical capability to a printer
 */
router.post('/printers/:id/capabilities', async (req, res) => {
    try {
        const capId = await printerRegistryService.addCapability(req.params.id, req.body);
        res.status(201).json({ id: capId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add capability', message: err.message });
    }
});

/**
 * @route POST /api/federation/printers/:id/credentials
 * @desc Generate new HMAC credentials for a printer (Admin only)
 */
router.post('/printers/:id/credentials', async (req, res) => {
    try {
        const creds = await printerCredentialService.createCredentials(req.params.id);
        res.status(201).json(creds);
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate credentials', message: err.message });
    }
});

/**
 * @route POST /api/federation/admin/matchmaking/:jobId
 * @desc Manual matchmaking trigger for testing/admin
 */
router.post('/admin/matchmaking/:jobId', async (req, res) => {
    try {
        const { db } = require('@ppos/shared-infra');
        const { rows } = await db.query('SELECT * FROM jobs WHERE id = ?', [req.params.jobId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Job not found' });
        
        const job = rows[0];
        const candidates = await federatedMatchmakerService.findBestCandidates(job.data);
        
        if (candidates.length > 0) {
            const offerId = await dispatchOfferService.createOffer(job.id, candidates[0]);
            res.json({ success: true, offerId, winningCandidate: candidates[0] });
        } else {
            res.status(404).json({ success: false, message: 'No compatible candidates found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Matchmaking failed', message: err.message });
    }
});

/**
 * @route POST /api/federation/admin/redispatch/:jobId
 * @desc Manual redispatch trigger (Phase 23.F)
 */
router.post('/admin/redispatch/:jobId', async (req, res) => {
    try {
        const success = await RedispatchService.triggerRedispatch(req.params.jobId, null, 'MANUAL_OVERRIDE');
        res.json({ success });
    } catch (err) {
        res.status(500).json({ error: 'Redispatch failed', message: err.message });
    }
});

/**
 * @route GET /api/federation/health/overview
 * @desc General network health status (Phase 23.F)
 */
router.get('/health/overview', async (req, res) => {
    try {
        const overview = await federationCockpitService.getOverview();
        res.json(overview);
    } catch (err) {
        res.status(500).json({ error: 'Cockpit overview failed', message: err.message });
    }
});

/**
 * @route GET /api/federation/printers
 * @desc List all federated printer nodes with health data (Phase 23.G)
 */
router.get('/printers', async (req, res) => {
    try {
        const printers = await federationCockpitService.getPrinters();
        res.json(printers);
    } catch (err) {
        res.status(500).json({ error: 'List printers failed', message: err.message });
    }
});

/**
 * @route GET /api/federation/stuck
 * @desc Get jobs with SLA risks or dwelling too long in a state (Phase 23.G)
 */
router.get('/stuck', async (req, res) => {
    try {
        const stuck = await federationCockpitService.getStuckJobs();
        res.json(stuck);
    } catch (err) {
        res.status(500).json({ error: 'Fetch stuck jobs failed', message: err.message });
    }
});

/**
 * @route GET /api/federation/jobs/:id/timeline
 * @desc Get full event timeline for a dispatch (Phase 23.G)
 */
router.get('/jobs/:id/timeline', async (req, res) => {
    try {
        const timeline = await federationCockpitService.getJobTimeline(req.params.id);
        res.json(timeline);
    } catch (err) {
        res.status(500).json({ error: 'Fetch timeline failed', message: err.message });
    }
});

// --- PRINTER AGENT ENDPOINTS (SECURE) ---

/**
 * @route POST /api/federation/heartbeat
 * @desc Report printer health and current capacity
 */
router.post('/heartbeat', requirePrinterAuth(), async (req, res) => {
    try {
        await printerRegistryService.updateStatus(req.printer.id, req.body);
        res.json({ status: 'ok', serverTime: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ error: 'Heartbeat failed', message: err.message });
    }
});

/**
 * @route GET /api/federation/jobs/available
 * @desc Poll for compatible job offers (Phase 23.C)
 */
router.get('/jobs/available', requirePrinterAuth(), async (req, res) => {
    try {
        const offers = await dispatchOfferService.getActiveOffers(req.printer.id);
        res.json({ 
            offers: offers.map(o => ({
                id: o.id,
                job_id: o.job_id,
                expires_at: o.offer_expires_at,
                spec: o.job_data
            })), 
            pollAfterSeconds: offers.length > 0 ? 300 : 60 
        });
    } catch (err) {
        res.status(500).json({ error: 'Poll failed', message: err.message });
    }
});

/**
 * @route POST /api/federation/jobs/:id/accept
 * @desc Accept a job offer (Phase 23.C)
 */
router.post('/jobs/:id/accept', requirePrinterAuth(), async (req, res) => {
    try {
        const success = await dispatchOfferService.acceptOffer(req.params.id);
        if (success) {
            // AUTOMATICALLY CREATE PACKAGE UPON ACCEPTANCE (Phase 23.D)
            await jobPackageService.createPackage(req.params.id);
            
            // INITIALIZE PRODUCTION STATE (Phase 23.E)
            const { db } = require('@ppos/shared-infra');
            const { rows } = await db.query('SELECT job_id, printer_id FROM federated_dispatches WHERE id = ?', [req.params.id]);
            await productionStateService.transition({
                jobId: rows[0].job_id,
                dispatchId: req.params.id,
                printerId: req.printer.id,
                newState: 'ACCEPTED',
                source: 'system',
                reason: 'Job offer accepted by printer.'
            });

            res.json({ success: true, status: 'ACCEPTED_AND_READY' });
        } else {
            res.status(400).json({ success: false, error: 'Offer expired or invalid' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Accept failed', message: err.message });
    }
});

/**
 * @route GET /api/federation/jobs/:id/package
 * @desc Get the production job package manifest (Phase 23.D)
 */
router.get('/jobs/:id/package', requirePrinterAuth(), async (req, res) => {
    try {
        const pkg = await jobPackageService.getPackage(req.params.id, req.printer.id);
        if (!pkg) return res.status(404).json({ error: 'Package not found' });
        res.json(pkg);
    } catch (err) {
        res.status(500).json({ error: 'Fetch package failed', message: err.message });
    }
});

/**
 * @route POST /api/federation/jobs/:id/package/downloaded
 * @desc Confirm package download and integrity check (Phase 23.D)
 */
router.post('/jobs/:id/package/downloaded', requirePrinterAuth(), async (req, res) => {
    try {
        await jobPackageService.updatePackageStatus(req.params.id, 'downloaded');
        res.json({ success: true, status: 'DOWNLOADED' });
    } catch (err) {
        res.status(500).json({ error: 'Download confirmation failed', message: err.message });
    }
});

/**
 * @route POST /api/federation/jobs/:id/received
 * @desc Final handshake: Agent confirms receipt of all assets (Phase 23.D)
 */
router.post('/jobs/:id/received', requirePrinterAuth(), async (req, res) => {
    try {
        await jobPackageService.updatePackageStatus(req.params.id, 'received');
        
        // Log Production Transition (Phase 23.E)
        const { db } = require('@ppos/shared-infra');
        const { rows } = await db.query('SELECT job_id FROM federated_dispatches WHERE id = ?', [req.params.id]);
        await productionStateService.transition({
            jobId: rows[0].job_id,
            dispatchId: req.params.id,
            printerId: req.printer.id,
            newState: 'RECEIVED_BY_PRINTER',
            source: 'printer_agent',
            reason: 'Printer confirmed physical receipt and integrity of the package.'
        });

        res.json({ success: true, status: 'RECEIVED_BY_PRINTER' });
    } catch (err) {
        res.status(500).json({ error: 'Receipt confirmation failed', message: err.message });
    }
});

/**
 * @route POST /api/federation/jobs/:id/package/fail
 * @desc Report package or asset delivery failure (Phase 23.D)
 */
router.post('/api/federation/jobs/:id/package/fail', requirePrinterAuth(), async (req, res) => {
    try {
        await jobPackageService.updatePackageStatus(req.params.id, 'failed', req.body.reason);
        res.json({ success: true, status: 'FAILED' });
    } catch (err) {
        res.status(500).json({ error: 'Failure reporting failed', message: err.message });
    }
});

/**
 * @route POST /api/federation/jobs/:id/reject
 * @desc Reject a job offer (Phase 23.C)
 */
router.post('/jobs/:id/reject', requirePrinterAuth(), async (req, res) => {
    try {
        await dispatchOfferService.rejectOffer(req.params.id, req.body.reasonCode || 'USER_REJECTED');
        res.json({ success: true, status: 'REJECTED' });
    } catch (err) {
        res.status(500).json({ error: 'Reject failed', message: err.message });
    }
});

/**
 * @route POST /api/federation/jobs/:id/status
 * @desc Report production status update (Phase 23.E)
 */
router.post('/jobs/:id/status', requirePrinterAuth(), async (req, res) => {
    try {
        const { db } = require('@ppos/shared-infra');
        const { rows } = await db.query('SELECT job_id FROM federated_dispatches WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Dispatch not found' });

        await productionStateService.transition({
            jobId: rows[0].job_id,
            dispatchId: req.params.id,
            printerId: req.printer.id,
            newState: req.body.newState,
            source: 'printer_agent',
            reason: req.body.reason,
            payload: req.body.payload
        });

        res.json({ success: true, status: req.body.newState });
    } catch (err) {
        res.status(400).json({ error: 'Status transition failed', message: err.message });
    }
});

/**
 * @route GET /api/federation/jobs/:id/history
 * @desc Get production state history (Phase 23.E)
 */
router.get('/jobs/:id/history', async (req, res) => {
    try {
        const history = await productionStateService.getStateHistory(req.params.id);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Fetch history failed', message: err.message });
    }
});

module.exports = router;
