export function resolveApplicableGates(input: {
    targetType: 'story' | 'repo' | 'program';
    targetId: string;
    governanceProfiles: string[];
}) {
    return [
        {
            gateId: `gate.${input.targetType}.integrity.v1`,
            severity: 'hard',
            requiredEvidence: ['structural_checksum', 'validation_audit']
        }
    ];
}
