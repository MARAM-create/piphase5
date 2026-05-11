export interface Avis {
  id?: number;
  titre: string;
  commentaire: string;
  rating: number;
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  trusted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AvisStats {
  averageRating: number;
  totalReviews: number;
  sentimentDistribution: { [key: string]: number };
}
