// ppos-shared-contracts/src/types.ts

export type JobStatus = 'PENDING' | 'PREFLIGHTING' | 'READY_FOR_PRICING' | 'PRICING' | 'OFFERED' | 'ASSIGNED' | 'CANCELLED' | 'ERROR';

export interface GlobalJobSpecs {
    format: string;
    pageCount: number;
    colorMode: 'CMYK' | 'GRAYSCALE' | 'SPECIAL';
    binding: string;
    paperWeight?: string;
}

export interface GlobalJobState {
    jobId: string;
    traceId: string;
    status: JobStatus;
    specs?: GlobalJobSpecs;
    admittedAt: string;
    updatedAt: string;
}

export interface NodeCapability {
    nodeId: string;
    tier: 'PREMIER' | 'CERTIFIED' | 'SANDBOX';
    supportedFormats: string[];
    maxPageCount: number;
}
