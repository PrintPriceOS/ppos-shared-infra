import type { EvidenceBundle } from '@ppos/build-program-core';

export interface ConsolidatedEvidenceView {
    bundles: EvidenceBundle[];
    consolidatedAt: string;
}

export function consolidateEvidenceBundles(bundles: EvidenceBundle[]): ConsolidatedEvidenceView {
    return {
        bundles,
        consolidatedAt: new Date().toISOString()
    };
}
