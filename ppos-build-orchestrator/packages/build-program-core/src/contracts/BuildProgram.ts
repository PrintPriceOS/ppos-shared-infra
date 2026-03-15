export interface BuildProgram {
    programId: string;
    profileId: string;
    version: string;
    name: string;
    state: string;
    workspace: {
        workspaceId: string;
        rootPath: string;
    };
    repositories: any[];
    stories: any[];
}
