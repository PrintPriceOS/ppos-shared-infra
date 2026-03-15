export type CiActivationRequest = {
    repoId: string;
    repoPath: string;
    includeWorkflows: boolean;
    includeTypecheck: boolean;
    includeLint: boolean;
    includeTests: boolean;
};

export type CiActivationResult = {
    repoId: string;
    workflowsActivated: string[];
    checksConfigured: string[];
    warnings: string[];
    errors: string[];
    valid: boolean;
};

export type CiReadinessReport = {
    repoId: string;
    packageManifestPresent: boolean;
    tsconfigPresent: boolean;
    workflowsPresent: boolean;
    scriptsPresent: string[];
    missingScripts: string[];
    valid: boolean;
    warnings: string[];
    generatedAt: string;
};
