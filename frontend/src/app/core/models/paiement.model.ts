import { StatutPaiement } from './enums.model';

export interface Paiement {
  id: number;
  contratId: number;
  clientId: number;
  clientFullName: string;
  annonceTitre?: string;
  montantTotal: number;
  stripeSessionId: string;
  datePaiement: string;
  statutPaiement: StatutPaiement;
  checkoutUrl: string;
  fichierRecuPdfUrl?: string;

  // Champs optionnels requis pour l'affichage via FullCalendar
  title?: string;
  date?: string;
  allDay?: boolean;
  color?: string;
}
