// src/app/core/models/meuble.model.ts

export type EtatMeuble = 'NEUF' | 'BON_ETAT' | 'USAGE';
export type StatutMeuble = 'DISPONIBLE' | 'RESERVE' | 'VENDU';

export interface Meuble {
  id: number;
  titre: string;
  description: string;
  prix: number;
  etat: EtatMeuble;
  statut: StatutMeuble;
  categorie: string;
  ville: string;
  photos: string[];
  creeLe: string;
  vendeurId: number;
  vendeurPrenom: string;
  vendeurNom: string;
  vendeurEmail: string;
  vendeurTelephone: string;
}

export interface MeubleRequest {
  titre: string;
  description: string;
  prix: number;
  etat: EtatMeuble;
  categorie: string;
  ville: string;
}
