import { GateDefinition, GateEvaluationResult } from '@ppos/contracts/GateDefinition';
import { ConsolidatedEvidenceView } from '@ppos/evidence-bundles';
import { EvidenceBundle } from '@ppos/build-program-core';

export function evaluateRepoGate(
    gate: GateDefinition,
    repoId: string,
    evidence: ConsolidatedEvidenceView
): GateEvaluationResult {
    const explanation: string[] = [];
    const requiredTypes = gate.requiredEvidenceTypes;
    const presentTypes = [...new Set(evidence.bundles.flatMap((b: EvidenceBundle) => b.evidenceTypes))];

    const missing = requiredTypes.filter(t => !presentTypes.includes(t));

    const status = missing.length === 0 ? 'pass' : 'fail';
    if (status === 'fail') {
        explanation.push(`Missing required evidence types: ${missing.join(', ')}`);
    }

    return {
        gateId: gate.gateId,
        targetId: repoId,
        status,
        passed: status === 'pass',
        blocking: gate.blockingOnFail && status === 'fail',
        explanation,
        evaluatedAt: new Date().toISOString()
    };
}

export function evaluateProgramGate(
    gate: GateDefinition,
    programId: string,
    evidence: ConsolidatedEvidenceView
): GateEvaluationResult {
    const explanation: string[] = [];
    const requiredTypes = gate.requiredEvidenceTypes;
    const presentTypes = [...new Set(evidence.bundles.flatMap((b: EvidenceBundle) => b.evidenceTypes))];

    const missing = requiredTypes.filter(t => !presentTypes.includes(t));

    const status = missing.length === 0 ? 'pass' : 'fail';
    if (status === 'fail') {
        explanation.push(`Missing mandatory evidence: ${missing.join(', ')}`);
    }

    return {
        gateId: gate.gateId,
        targetId: programId,
        status,
        passed: status === 'pass',
        blocking: gate.blockingOnFail && status === 'fail',
        explanation,
        evaluatedAt: new Date().toISOString()
    };
}
