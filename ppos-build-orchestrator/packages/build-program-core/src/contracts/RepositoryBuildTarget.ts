export type RepositoryBuildTarget = {
    repoId: string;
    repoClass: string;
    priority: 'P0' | 'P1' | 'P2';
    scaffoldProfile: string;
    starterSliceId?: string;
    requiredPackages: string[];
    pipelines: string[];
    governanceProfiles: string[];
    dependencies: string[];
};
