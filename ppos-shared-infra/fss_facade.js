/**
 * @ppos/shared-infra - FSS Facade
 * 
 * Central entry point for federated services.
 */
const RegionalReplicationReceiver = require('./packages/fss/transport/RegionalReplicationReceiver');
const OutboxRelay = require('./packages/fss/transport/OutboxRelay');
const secretManager = require('./packages/ops/SecretManager');

const mockTrustRegistry = {
    'EU-PPOS-1': secretManager.get('PEER_EU_PUBLIC_KEY') || 'MOCK_PUBLIC_KEY',
    'US-PPOS-1': secretManager.get('PEER_US_PUBLIC_KEY') || 'MOCK_PUBLIC_KEY'
};

const receiver = new RegionalReplicationReceiver({
    trustRegistry: mockTrustRegistry
});

module.exports = {
    fssReceiver: receiver,
    RegionalReplicationReceiver,
    OutboxRelay
};
