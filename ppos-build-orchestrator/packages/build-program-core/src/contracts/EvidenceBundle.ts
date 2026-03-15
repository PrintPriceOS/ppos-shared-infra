import type { EvidenceArtifactRef } from './EvidenceArtifactRef';

export type EvidenceBundle = {
    bundleId: string;
    targetType: 'story' | 'repo' | 'wave' | 'program';
    targetId: string;
    timestamp: string;
    evidenceTypes: string[];
    artifactRefs: EvidenceArtifactRef[];
    gateResultIds: string[];
    summary: string;
};
