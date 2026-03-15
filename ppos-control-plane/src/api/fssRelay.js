const express = require('express');
const router = express.Router();
const { fssReceiver } = require('@ppos/shared-infra');

/**
 * @route POST /fss/relay
 * @desc Ingress point for signed federated events.
 */
router.post('/relay', async (req, res) => {
    try {
        const envelope = req.body;
        
        if (!envelope || !envelope.event_id) {
            return res.status(400).json({ error: 'REJECTED_MALFORMED', message: 'Invalid FSS envelope' });
        }

        const result = await fssReceiver.receive(envelope);

        switch (result.status) {
            case 'ACCEPTED':
                return res.status(202).json({ status: 'ACCEPTED', event_id: envelope.event_id });
            case 'DUPLICATE':
                return res.status(200).json({ status: 'DUPLICATE', message: 'Event already processed' });
            case 'REJECTED_INVALID_SIGNATURE':
                return res.status(401).json({ status: 'REJECTED_INVALID_SIGNATURE', message: 'Cryptographic verification failed' });
            case 'REJECTED_UNAUTHORIZED':
                return res.status(403).json({ status: 'REJECTED_UNAUTHORIZED', message: 'Sender lacks authority for this event' });
            default:
                return res.status(500).json({ status: 'ERROR', message: result.reason || 'Processing failed' });
        }

    } catch (err) {
        console.error('[FSS-RELAY-API] Critical error:', err.message);
        res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
    }
});

module.exports = router;
