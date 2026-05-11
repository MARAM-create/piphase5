export type Role = 'ETUDIANT' | 'PROPRIETAIRE' | 'PRESTATAIRE' | 'ADMIN';

export type Statut =
  | 'EN_ATTENTE_EMAIL'
  | 'EN_ATTENTE_ADMIN'
  | 'ACTIF'
  | 'REJETE'
  | 'BANNI';

export interface Utilisateur {
  id:           number;
  prenom:       string;
  nom:          string;
  email:        string;
  telephone?:   string;
  age?:         number;
  photoProfil?: string;
  bio?:         string;
  role:         Role;
  statut:       Statut;
  emailVerifie: boolean;
  creeLe:       string;
}

export interface ReponseAuth {
  token:       string;
  utilisateur: Utilisateur;
}

export interface StatistiquesAdmin {
  total:         number;
  enAttente:     number;
  actifs:        number;
  bannis:        number;
  rejetes:       number;
  etudiants:     number;
  proprietaires: number;
  prestataires:  number;
}

export const ROLES_INSCRIPTION = [
  {
    valeur:      'ETUDIANT',
    libelle:     'Étudiant',
    icone:       '🎓',
    description: 'Je cherche un logement étudiant'
  },
  {
    valeur:      'PROPRIETAIRE',
    libelle:     'Propriétaire',
    icone:       '🏠',
    description: 'Je propose des logements à louer'
  },
  {
    valeur:      'PRESTATAIRE',
    libelle:     'Prestataire',
    icone:       '🔧',
    description: 'Je propose des services aux résidents'
  }
];

export const LIBELLES_ROLE: Record<string, string> = {
  ETUDIANT:     'Étudiant',
  PROPRIETAIRE: 'Propriétaire',
  PRESTATAIRE:  'Prestataire',
  ADMIN:        'Administrateur'
};

export const LIBELLES_STATUT: Record<string, string> = {
  EN_ATTENTE_EMAIL: 'Email non vérifié',
  EN_ATTENTE_ADMIN: 'En attente',
  ACTIF:            'Actif',
  REJETE:           'Rejeté',
  BANNI:            'Banni'
};
// Ajouter dans utilisateur.model.ts

export interface ProfilEtudiant {
  id?:             number;
  universite?:     string;
  filiere?:        string;
  niveauEtude?:    NiveauEtude;
  anneeDiplome?:   number;
  numeroEtudiant?: string;
  villeRecherche?: string;
  budgetMax?:      number;
  typeLogement?:   string;
}

export type NiveauEtude =
  'LICENCE_1' | 'LICENCE_2' | 'LICENCE_3' |
  'MASTER_1'  | 'MASTER_2'  | 'DOCTORAT'  | 'AUTRE';

export const NIVEAUX_ETUDE = [
  { valeur: 'LICENCE_1', libelle: 'Licence 1' },
  { valeur: 'LICENCE_2', libelle: 'Licence 2' },
  { valeur: 'LICENCE_3', libelle: 'Licence 3' },
  { valeur: 'MASTER_1',  libelle: 'Master 1'  },
  { valeur: 'MASTER_2',  libelle: 'Master 2'  },
  { valeur: 'DOCTORAT',  libelle: 'Doctorat'  },
  { valeur: 'AUTRE',     libelle: 'Autre'      }
];

export interface ProfilProprietaire {
  id?:               number;
  adresse?:          string;
  ville?:            string;
  codePostal?:       string;
  numeroFiscal?:     string;
  nbProprietes?:     number;
  typeBien?:         string;
  descriptionBiens?: string;
}

export interface ProfilPrestataire {
  id?:               number;
  specialite?:       string;
  experienceAnnees?: number;
  certifications?:   string;
  zoneIntervention?: string;
  tarifHoraire?:     number;
  disponibilite?:    string;
  siteWeb?:          string;
}
