import fs from 'node:fs';
import path from 'node:path';
import type { EvidenceBundle } from '@ppos/build-program-core';

export function persistEvidenceBundle(bundle: EvidenceBundle, evidenceDir: string) {
    const filePath = path.join(evidenceDir, `${bundle.bundleId}.json`);
    fs.mkdirSync(evidenceDir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(bundle, null, 2), 'utf8');
    return { filePath, bundleId: bundle.bundleId };
}
