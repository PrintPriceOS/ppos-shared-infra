import type { EvidenceBundle } from '@ppos/build-program-core';

export function createBootstrapEvidenceBundle(targetId: string, artifacts: any[]): EvidenceBundle {
    return {
        bundleId: `ev.bootstrap.${targetId}.${Date.now()}`,
        targetType: 'program',
        targetId,
        timestamp: new Date().toISOString(),
        evidenceTypes: ['workspace_structure', 'registry_integrity'],
        artifactRefs: artifacts,
        gateResultIds: [],
        summary: 'Bootstrap phase evidence consolidated.'
    };
}
