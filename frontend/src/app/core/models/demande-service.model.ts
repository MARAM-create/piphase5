// src/app/core/models/demande-service.model.ts

export type StatutDemande = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';

export interface DemandeServiceRequest {
  prestataireId: number;
  dateService: string;    // 'YYYY-MM-DD'
  heureService: string;   // 'HH:mm'
  probleme: string;
  adresse: string;
  ville: string;
}

export interface DemandeServiceResponse {
  id: number;
  dateService: string;
  heureService: string;
  probleme: string;
  adresse: string;
  ville: string;
  statut: StatutDemande;
  creeLe: string;
  demandeurId: number;
  demandeurPrenom: string;
  demandeurNom: string;
  demandeurEmail: string;
  demandeurTelephone: string;
  prestataireId: number;
  prestatairePrenom: string;
  prestataireNom: string;
  prestataireEmail: string;
  prestataireTelephone: string;
  prestataireSpecialite: string;
}

export interface ProfilPrestataireDTO {
  utilisateurId: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  photoProfil: string;
  specialite: string;
  experienceAnnees: number;
  certifications: string;
  zoneIntervention: string;
  tarifHoraire: number;
  disponibilite: string;
  siteWeb: string;
  ville: string;
  statutDemande: StatutDemande | null;
  demandeId: number | null;
}

export interface DisponibiliteDTO {
  dateService: string;
  heureService: string;
  statut: StatutDemande;
}
