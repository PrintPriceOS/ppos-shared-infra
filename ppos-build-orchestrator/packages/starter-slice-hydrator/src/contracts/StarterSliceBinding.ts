export type StarterSliceBinding = {
    repoId: string;
    repoClass: string;
    starterSliceId: string;
    requiredFiles: string[];
    requiredPackages: string[];
    requiredDocs: string[];
    requiredWorkflows: string[];
};

export type StarterFileResolution = {
    starterSliceId: string;
    repoId: string;
    files: {
        path: string;
        contentType: 'text' | 'json' | 'yaml' | 'ts' | 'md';
        content: string;
        required: boolean;
    }[];
};

export type StarterHydrationResult = {
    repoId: string;
    starterSliceId: string;
    filesWritten: string[];
    filesSkipped: string[];
    filesMerged: string[];
    warnings: string[];
    errors: string[];
    valid: boolean;
};

export type StarterIntegrityReport = {
    repoId: string;
    starterSliceId: string;
    requiredFilesPresent: boolean;
    missingFiles: string[];
    unexpectedConflicts: string[];
    valid: boolean;
    warnings: string[];
    generatedAt: string;
};
