import { PhotoDTO } from './photo';
import { AdresseDTO } from './adresse';
import { ChambreDTO } from './chambre';

export interface AnnonceLocationDTO {
  proprietaireId: number;
  idAnnonce: number;
  version: number;
  titre: string;
  description: string;
  prixMensuel: number;
  chargesMensuelles: number;
  montantCaution: number;
  surface: number;
  nombrePieces: number;
  etage: number;
  modeLocation: 'ENTIER' | 'PAR_CHAMBRE';
  typeLogement: 'STUDIO' | 'APPARTEMENT' | 'MAISON' | 'COLOCATION' | 'CHAMBRE_SEULE';
  typeMeublage: 'MEUBLE' | 'NON_MEUBLE' | 'SEMI_MEUBLE';
  dateDisponibiliteDebut: string;
  dateDisponibiliteFin: string;
  etatAnnonce: 'BROUILLON' | 'PUBLIEE' | 'INDISPONIBLE' | 'ARCHIVEE' | 'SUSPENDUE';
  statutModeration: 'EN_ATTENTE' | 'VALIDE' | 'REFUSE' | 'SIGNALE';
  dateCreation: string;
  dateModification: string;
  photos: PhotoDTO[];
  adresse: AdresseDTO;
  chambres: ChambreDTO[];
}
