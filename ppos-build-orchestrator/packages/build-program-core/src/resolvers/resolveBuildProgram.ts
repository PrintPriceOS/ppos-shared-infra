import { BuildProgram } from '@ppos/contracts/BuildProgram';
import { BuildProfile } from '@ppos/contracts/BuildProfile';
import { BuildPhaseDefinition } from '@ppos/contracts/BuildGovernanceProfile';

export function resolveBuildProgram(input: {
    profile: BuildProfile;
    phases: BuildPhaseDefinition[];
    repositories: any[];
    stories: any[];
}): BuildProgram {
    const { profile, repositories, stories } = input;

    return {
        programId: `prog.${profile.profileId}.${Date.now()}`,
        profileId: profile.profileId,
        version: '0.1.0',
        name: `${profile.name} Execution Plan`,
        state: 'defined',
        workspace: {
            workspaceId: 'ws.' + profile.profileId,
            rootPath: process.cwd()
        },
        repositories,
        stories
    };
}
