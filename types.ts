
export interface SubTask {
  id: string;
  name: string;
  description: string;
  agentType: string;
  costMNEE: number;
  status: 'pending' | 'processing' | 'review_pending' | 'completed' | 'failed' | 'reassigning';
  txHash?: string;
  revisionCount: number;
  assignedProviderId?: string; // Links to ServiceProvider.id
  fileMetadata?: {
    type: string;
    extension: string;
    size: string;
  };
}

export interface ServiceProvider {
  id: string;
  name: string;
  wallet: string;
  category: 'Tech' | 'Research' | 'Content' | 'Marketing' | 'Design';
  description: string;
}

export interface ProjectPlan {
  projectName: string;
  companyName: string;
  clientWallet: string;
  totalBudget: number;
  estimatedMargin: number;
  remainingBudget: number;
  tasks: SubTask[];
}

export interface ExecutionLog {
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'blockchain';
}
