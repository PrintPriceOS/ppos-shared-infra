const db = require('./packages/data/db');
const queue = require('./packages/data/queue');
const emailProvider = require('./packages/comms/emailProvider');
const webhookService = require('./packages/comms/webhookService');
const Notifier = require('./packages/comms/notifier');
const ciActivation = require('./packages/ops/CIActivationService');
const repoProvisioner = require('./packages/ops/RepoProvisioner');
const secretManager = require('./packages/ops/SecretManager');
const metricsService = require('./packages/ops/MetricsService');
const policyEnforcementService = require('./packages/governance/policyEnforcementService');
const resourceGovernanceService = require('./packages/governance/resourceGovernanceService');
const fairSchedulerService = require('./packages/governance/fairSchedulerService');
const fairDispatchOrchestrator = require('./packages/governance/fairDispatchOrchestrator');
const aiBudgetGovernanceService = require('./packages/governance/aiBudgetGovernanceService');
const circuitBreakerService = require('./packages/resilience/CircuitBreakerService');
const retryManager = require('./packages/resilience/RetryManager');
const sloEvaluationService = require('./packages/governance/SLOEvaluationService');
const aiCacheService = require('./packages/governance/AICacheService');
const aiInferenceService = require('./packages/governance/AIInferenceService');
const featureFlagService = require('./packages/governance/FeatureFlagService');
const printerRegistryService = require('./packages/federation/printerRegistryService');
const printerCredentialService = require('./packages/federation/printerCredentialService');
const federatedMatchmakerService = require('./packages/federation/federatedMatchmakerService');
const dispatchOfferService = require('./packages/federation/dispatchOfferService');
const jobPackageService = require('./packages/federation/jobPackageService');
const assetDeliveryService = require('./packages/federation/assetDeliveryService');
const productionStateService = require('./packages/federation/productionStateService');
const printerHealthService = require('./packages/federation/printerHealthService');
const { RedispatchService, FederatedSLAService } = require('./packages/federation/redispatchService');
const federationCockpitService = require('./packages/federation/federationCockpitService');

const resourceLifecycleService = require('./packages/governance/resourceLifecycleService');

// Multi-Region Awareness Layer (MVP)
const regionContext = require('./packages/region/RegionContext');
const regionFilter = require('./packages/region/RegionFilter');
const stateClassification = require('./packages/region/stateClassification');
const sanitizationUtils = require('./packages/region/sanitizationUtils');
const FssEventEnvelope = require('./packages/fss/FssEventEnvelope');
const EventSigner = require('./packages/fss/EventSigner');
const SignatureVerifier = require('./packages/fss/SignatureVerifier');
const FSSAdapter = require('./packages/fss/FSSAdapter');
const OutboxRelay = require('./packages/fss/OutboxRelay');
const { fssReceiver } = require('./fss_facade');
const TransportEventSigner = require('./packages/fss/transport/EventSigner'); // Renamed to avoid conflict
const InboxStore = require('./packages/fss/transport/InboxStore');
const PolicyAuthorityResolver = require('./packages/federation/PolicyAuthorityResolver');
const policyCacheManager = require('./packages/federation/PolicyCacheManager');
const RegionStalenessEvaluator = require('./packages/federation/RegionStalenessEvaluator');
const emergencyRestrictionManager = require('./packages/federation/EmergencyRestrictionManager');
const runtimePolicyResolver = require('./packages/federation/RuntimePolicyResolver');

module.exports = {
    db,
    queue,
    emailProvider,
    webhookService,
    Notifier,
    ciActivation,
    repoProvisioner,
    secretManager,
    metricsService,
    policyEnforcementService,
    resourceGovernanceService,
    fairSchedulerService,
    fairDispatchOrchestrator,
    aiBudgetGovernanceService,
    circuitBreakerService,
    retryManager,
    sloEvaluationService,
    aiCacheService,
    aiInferenceService,
    featureFlagService,
    printerRegistryService,
    printerCredentialService,
    federatedMatchmakerService,
    dispatchOfferService,
    jobPackageService,
    assetDeliveryService,
    productionStateService,
    printerHealthService,
    RedispatchService,
    FederatedSLAService,
    federationCockpitService,
    resourceLifecycleService,
    
    // Multi-Region Awareness Exports
    regionContext,
    regionFilter,
    ...stateClassification,
    ...sanitizationUtils,
    FSSAdapter,
    FssEventEnvelope,
    EventSigner,
    SignatureVerifier,
    fssReceiver,
    OutboxRelay,
    InboxStore,
    PolicyAuthorityResolver,
    policyCacheManager,
    RegionStalenessEvaluator,
    emergencyRestrictionManager,
    runtimePolicyResolver
};
