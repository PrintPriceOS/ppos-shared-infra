const crypto = require('crypto');
const { Queue, Worker } = require('bullmq');
const { connection } = require('./queue');

const INDUSTRIAL_EVENT_TYPES = {
  TELEMETRY_HEARTBEAT: 'telemetry.heartbeat',

  MANUFACTURING_DISPATCH_REQUESTED: 'manufacturing.dispatch.requested',
  MANUFACTURING_DISPATCH_SCORED: 'manufacturing.dispatch.scored',
  MANUFACTURING_DISPATCH_ASSIGNED: 'manufacturing.dispatch.assigned',
  MANUFACTURING_DISPATCH_STATUS_CHANGED: 'manufacturing.dispatch.status_changed',
  MANUFACTURING_DISPATCH_COMPLETED: 'manufacturing.dispatch.completed',
  MANUFACTURING_DISPATCH_FAILED: 'manufacturing.dispatch.failed',

  MANUFACTURING_CAPACITY_RESERVED: 'manufacturing.capacity.reserved',
  MANUFACTURING_CAPACITY_RELEASED: 'manufacturing.capacity.released',

  PREFLIGHT_JOB_REQUESTED: 'preflight.job.requested',
  PREFLIGHT_JOB_COMPLETED: 'preflight.job.completed',
  PREFLIGHT_JOB_FAILED: 'preflight.job.failed',

  AUTOFIX_JOB_REQUESTED: 'autofix.job.requested',
  AUTOFIX_JOB_COMPLETED: 'autofix.job.completed',
  AUTOFIX_JOB_FAILED: 'autofix.job.failed',

  CERTIFICATION_COMPLETED: 'certification.completed',
  ARTIFACT_READY: 'artifact.ready'
};

const INDUSTRIAL_QUEUE_NAMES = {
  INDUSTRIAL_EVENTS: 'industrial-events-v1',
  INDUSTRIAL_TELEMETRY: 'industrial-telemetry-v1',
  MANUFACTURING_DISPATCH: 'manufacturing-dispatch-v1',
  PREFLIGHT_REQUESTS: 'preflight-requests-v1',
  ARTIFACT_EVENTS: 'artifact-events-v1'
};

/**
 * Creates an industrial event envelope.
 */
function createIndustrialEventEnvelope(type, payload, options = {}) {
  if (!type || typeof type !== 'string') {
    throw new Error('Industrial event type is required and must be a string');
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Industrial event payload must be a non-null object');
  }

  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const source = process.env.PPOS_SERVICE_NAME || '@ppos/shared-infra';
  const trace_id = options.trace_id || options.traceId || id;
  const correlation_id = options.correlation_id || options.correlationId || trace_id;

  const envelope = {
    id,
    type,
    version: '1.0',
    source,
    tenant_id: options.tenant_id || options.tenantId,
    printhouse_id: options.printhouse_id || options.printhouseId,
    node_id: options.node_id || options.nodeId,
    job_id: options.job_id || options.jobId,
    dispatch_id: options.dispatch_id || options.dispatchId,
    trace_id,
    correlation_id,
    causation_id: options.causation_id || options.causationId,
    timestamp,
    payload
  };

  // Remove undefined fields
  Object.keys(envelope).forEach(key => {
    if (envelope[key] === undefined) {
      delete envelope[key];
    }
  });

  return envelope;
}

// Internal cache for queues to avoid re-creating them
const queueCache = {};

function getQueue(queueName) {
  if (!queueCache[queueName]) {
    queueCache[queueName] = new Queue(queueName, { connection });
  }
  return queueCache[queueName];
}

/**
 * Publishes an industrial event to the appropriate queue.
 */
async function publishIndustrialEvent(type, payload, options = {}) {
  const envelope = createIndustrialEventEnvelope(type, payload, options);
  
  let queueName = INDUSTRIAL_QUEUE_NAMES.INDUSTRIAL_EVENTS;

  if (type.startsWith('telemetry.')) {
    queueName = INDUSTRIAL_QUEUE_NAMES.INDUSTRIAL_TELEMETRY;
  } else if (type.startsWith('manufacturing.')) {
    queueName = INDUSTRIAL_QUEUE_NAMES.MANUFACTURING_DISPATCH;
  } else if (type.startsWith('preflight.') || type.startsWith('autofix.')) {
    queueName = INDUSTRIAL_QUEUE_NAMES.PREFLIGHT_REQUESTS;
  } else if (type.startsWith('artifact.') || type.startsWith('certification.')) {
    queueName = INDUSTRIAL_QUEUE_NAMES.ARTIFACT_EVENTS;
  }

  const queue = getQueue(queueName);
  
  const jobOptions = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
    ...options.jobOptions
  };

  try {
    const job = await queue.add(type, envelope, jobOptions);
    return {
      ok: true,
      queue: queueName,
      jobId: job.id,
      eventId: envelope.id,
      envelope
    };
  } catch (error) {
    console.error(`[INDUSTRIAL-EVENTS] Failed to publish event ${type}:`, error.message);
    throw error;
  }
}

/**
 * Creates a BullMQ worker for industrial events.
 */
function createIndustrialEventWorker(queueName, handler, options = {}) {
  if (typeof handler !== 'function') {
    throw new Error('Worker handler must be a function');
  }

  const worker = new Worker(queueName, async (job) => {
    return handler(job.data, job);
  }, {
    connection,
    concurrency: options.concurrency || 1,
    ...options
  });

  worker.on('completed', (job) => {
    if (options.logLevel !== 'silent') {
      console.log(`[INDUSTRIAL-EVENTS] Job ${job.id} completed in queue ${queueName}`);
    }
  });

  worker.on('failed', (job, err) => {
    console.error(`[INDUSTRIAL-EVENTS] Job ${job ? job.id : 'unknown'} failed in queue ${queueName}:`, err.message);
  });

  return worker;
}

module.exports = {
  INDUSTRIAL_EVENT_TYPES,
  INDUSTRIAL_QUEUE_NAMES,
  createIndustrialEventEnvelope,
  publishIndustrialEvent,
  createIndustrialEventWorker
};
