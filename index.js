const db = require('./packages/data/db');
const queue = require('./packages/data/queue');
const emailProvider = require('./packages/comms/emailProvider');
const webhookService = require('./packages/comms/webhookService');
const Notifier = require('./packages/comms/notifier');
const ciActivation = require('./packages/ops/CIActivationService');
const repoProvisioner = require('./packages/ops/RepoProvisioner');

module.exports = {
    db,
    queue,
    emailProvider,
    webhookService,
    Notifier,
    ciActivation,
    repoProvisioner
};
