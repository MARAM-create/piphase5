export interface Reclamation {
  id?: number;
  titre: string;
  description: string;
  type: string;
  status?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  category?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string;
}

export interface ReclamationStats {
  total: number;
  statusDistribution: { [key: string]: number };
  priorityDistribution: { [key: string]: number };
  categoryDistribution: { [key: string]: number };
}
