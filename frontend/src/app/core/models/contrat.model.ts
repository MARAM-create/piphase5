import { IAValidationStatus, StatutContrat, StatutIa } from './enums.model';

export interface Contrat {
  id: number;
  demandeId: number;
  locataireId: number;
  locataireFullName: string;
  bailleurId: number;
  bailleurFullName: string;
  annonceId: number;
  annonceTitre: string;
  pdfViergeUrl: string;
  imageScanneUrl: string;
  iaValidationStatus: IAValidationStatus;
  statutIa: StatutIa;
  statutContrat: StatutContrat;
  raisonIa: string;
  dateDebut: string;
  dateFin: string;
  prochainPaiement: string;
}
