import type { BuildProgram, ProgramOperationsView } from '@ppos/build-program-core';

export function buildProgramOperationsView(program: BuildProgram, state: any): ProgramOperationsView {
    return {
        programId: program.programId,
        profileId: program.profileId,
        state: state.programState,
        promotable: state.promotable,
        totalRepos: program.repositories.length,
        promotableRepos: state.promotableRepos,
        blockedRepos: state.blockedRepos,
        totalStories: program.stories.length,
        readyStories: state.readyStories,
        blockedStories: state.blockedStories,
        failedHardGates: state.failedHardGates,
        generatedAt: new Date().toISOString()
    };
}
