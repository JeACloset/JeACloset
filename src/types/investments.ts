export interface Investment {
  id: string;
  supplier: string;
  date: Date;
  totalItems: number;
  soldItems: number;
  totalCost: number;
  totalSold: number;
  profit: number;
  progress: number; // 0-100%
  status: 'red' | 'yellow' | 'green'; // baseado no progresso
  createdAt: Date;
  updatedAt: Date;
}
