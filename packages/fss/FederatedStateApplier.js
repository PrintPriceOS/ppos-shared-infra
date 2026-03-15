const signatureVerifier = require('./SignatureVerifier');
const federatedAuth = require('./FederatedAuthorizationService');
const conflictDetector = require('./ConflictDetector');
const convergenceLedger = require('./ConvergenceLedger');
const quarantineStore = require('./QuarantineStore');
const reducerRegistry = require('./reducers');

/**
 * FederatedStateApplier (Phase v1.7.0)
 * 
 * The central surface for applying federated events to the regional state.
 * Implements the deterministic processing pipeline: 
 * VERIFY -> AUTHORIZE -> CONFLICT_CHECK -> APPLY -> AUDIT.
 */
class FederatedStateApplier {
    /**
     * Entry point for a single event application attempt.
     * 
     * @param {Object} envelope - The FSS signed envelope
     * @param {Object} options - { force: boolean, isReplay: boolean }
     */
    async apply(envelope, options = {}) {
        const { event_id, event_name, origin_region } = envelope;
        console.log(`[APPLIER] Attempting to apply ${event_id} (${event_name})`);

        await conflictDetector.init();

        try {
            // 1. Signature Verification (Conditional for Replay)
            if (!options.isReplay) {
                const isSignatureValid = signatureVerifier.verify(envelope);
                if (!isSignatureValid) {
                    await convergenceLedger.recordRejected(envelope, 'INVALID_SIGNATURE');
                    throw new Error(`[CONVERGENCE] Invalid signature for event ${event_id}`);
                }
            } else {
                console.log(`[CONVERGENCE] Skipping signature check for Replay of ${event_id}`);
            }

            // 2. Authorization Check (Pre-condition)
            const isAuthorized = federatedAuth.isAuthorized(origin_region, event_name);
            if (!isAuthorized) {
                await convergenceLedger.recordRejected(envelope, 'UNAUTHORIZED');
                throw new Error(`[CONVERGENCE] Region ${origin_region} unauthorized for ${event_name}`);
            }

            // 3. Conflict Detection (Business Consistency)
            const inspection = await conflictDetector.inspect(envelope);
            if (inspection.conflict) {
                await quarantineStore.quarantine(envelope, inspection.code, { reason: inspection.reason });
                await convergenceLedger.recordRejected(envelope, inspection.code, { reason: inspection.reason });
                return { status: 'REJECTED_CONFLICT', code: inspection.code };
            }

            if (inspection.duplicate && !options.force) {
                return { status: 'SKIPPED_DUPLICATE' };
            }

            // 4. Execution (Isolated Reducers)
            const reducer = reducerRegistry.getReducer(event_name);
            if (!reducer) {
                await convergenceLedger.recordRejected(envelope, 'MISSING_REDUCER');
                return { status: 'FAILED', error: 'NO_REDUCER' };
            }

            try {
                await reducer.apply(envelope);
            } catch (err) {
                console.error(`[FEDERATED-APPLIER] Reducer ${event_name} failed:`, err);
                await quarantineStore.quarantine(envelope, 'EXECUTION_FAILED', { error: err.message });
                await convergenceLedger.recordRejected(envelope, 'EXECUTION_FAILED', { error: err.message });
                throw err;
            }

            // 5. Commit Versions & Audit (Async)
            await conflictDetector.update(envelope);
            
            if (options.isReplay) {
                await convergenceLedger.recordReplayed(envelope);
            } else {
                await convergenceLedger.recordApplied(envelope);
            }

            return { status: 'APPLIED' };

        } catch (err) {
            console.error(`[CONVERGENCE-CRITICAL] Application failed for ${event_id}:`, err);
            return { status: 'FAILED', error: err.message || err.toString() };
        }
    }
}

module.exports = new FederatedStateApplier();
