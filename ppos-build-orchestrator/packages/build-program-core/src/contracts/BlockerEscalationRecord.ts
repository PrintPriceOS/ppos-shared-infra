export type BlockerEscalationRecord = {
    escalationId: string;
    blockerId: string;
    programId: string;
    targetType: 'repo' | 'story' | 'program' | 'gate';
    targetId: string;
    requestedBy: string;
    reason: string;
    createdAt: string;
    status: 'open' | 'acknowledged' | 'resolved';
};
