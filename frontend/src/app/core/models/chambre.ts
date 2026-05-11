import { PhotoDTO } from './photo';
export interface ChambreDTO {
  idChambre: number;
  titre: string;
  description: string;
  surface: number;
  numero: number;
  prixMensuel: number;
  etatChambre: 'DISPONIBLE' | 'RESERVEE' | 'LOUEE' | 'HORS_SERVICE';
  photos: PhotoDTO[];
}
