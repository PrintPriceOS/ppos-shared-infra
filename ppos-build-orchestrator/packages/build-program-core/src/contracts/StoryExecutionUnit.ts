import { StoryExecutionState } from '../state/storyExecutionStates';

export type StoryExecutionUnit = {
    storyId: string;
    repoId: string;
    epicId: string;
    capabilityId: string;
    title: string;
    description?: string;
    priority: 'P0' | 'P1' | 'P2';
    dependencies: string[];
    acceptanceCriteria: string[];
    executorType: 'human' | 'agent' | 'hybrid';
    state: StoryExecutionState;
};
