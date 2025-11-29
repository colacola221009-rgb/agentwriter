export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  resultContent?: string; // The markdown content generated for this step
}

export interface PlanResponse {
  tasks: {
    title: string;
    description: string;
  }[];
}

export enum AppState {
  IDLE = 'IDLE',
  PLANNING = 'PLANNING',
  EXECUTING = 'EXECUTING',
  FINISHED = 'FINISHED'
}