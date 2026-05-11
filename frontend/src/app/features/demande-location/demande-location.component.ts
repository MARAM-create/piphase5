import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface AnnonceLocationDTO {
  id: number;
  titre: string;
  adresse: string;
  prix: number;
  typeLocation: string;
  quartier: string;
  nombreChambres: number;
  surface: number;
  imageUrl?: string;
}

interface ProfilEtudiantDTO {
  id: number;
  universite: string;
  utilisateur?: {
    id: number;
  };
}

type TypeVisiteValue = 'SUR_PLACE' | 'EN_LIGNE';
type FormatVisiteValue = 'DIRECT' | 'VIDEO' | 'LES_DEUX';

@Component({
  selector: 'app-demande-location',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demande-location.component.html',
  styleUrls: ['./demande-location.component.css']
})
export class DemandeLocationComponent implements OnInit {
  private API = 'http://192.168.1.175:30808/api';

  utilisateurConnecte: any = null;
  currentStep = 1;
  demandeId: number | null = null;
  annonce: AnnonceLocationDTO | null = null;
  loading = false;
  erreurs: { [key: string]: string } = {};
  dateAujourdhui = new Date().toISOString().split('T')[0];

  steps = ['Infos', 'Préférences', 'Visite', 'Disponibilités', 'Message'];

  criteres = [
    { label: 'Prix', value: 'prix' },
    { label: 'Proximité université', value: 'proximite' },
    { label: 'Calme', value: 'calme' },
    { label: 'Espace', value: 'espace' },
    { label: 'Disponibilité immédiate', value: 'disponibilite' }
  ];

  besoins = [
    { label: 'Études', value: 'etudes' },
    { label: 'Stage', value: 'stage' },
    { label: 'Travail', value: 'travail' },
    { label: 'Hébergement temp.', value: 'temporaire' }
  ];

  typesVisite: { label: string; value: TypeVisiteValue }[] = [
    { label: 'Sur place', value: 'SUR_PLACE' },
    { label: 'En ligne', value: 'EN_LIGNE' }
  ];

  formatsVisite: { label: string; value: FormatVisiteValue }[] = [
    { label: 'Visite en direct', value: 'DIRECT' },
    { label: 'Vidéo préenregistrée', value: 'VIDEO' },
    { label: 'Les deux', value: 'LES_DEUX' }
  ];

  momentsVisite = [
    { label: 'En semaine', value: 'semaine' },
    { label: 'Le week-end', value: 'weekend' },
    { label: 'En soirée', value: 'soiree' },
    { label: 'Peu importe', value: 'peu_importe' }
  ];

  jours = [
    { label: 'L. Lu', value: 'lundi' },
    { label: 'Mar', value: 'mardi' },
    { label: 'Mer', value: 'mercredi' },
    { label: 'Jeu', value: 'jeudi' },
    { label: 'Ven', value: 'vendredi' },
    { label: 'Sam', value: 'samedi' },
    { label: 'Dim', value: 'dimanche' }
  ];


  form = {
    // Étape 1
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    ecole: '',

    // Étape 2
    nombrePersonnes: '',
    dateEntree: '',
    dureeLocation: '',
    budgetMax: null as number | null,
    villeActuelle: '',
    criteresPrincipaux: [] as string[],
    besoinPrincipal: '',
    remarqueLogement: '',

    // Étape 3
    typeVisite: 'EN_LIGNE' as TypeVisiteValue,
    formatVisite: 'DIRECT' as FormatVisiteValue | null,
    momentVisite: '',

    // Étape 4
    visiteDate: '',
    plageHoraire: '',
    joursDisponibles: [] as string[],
    remarqueDispo: '',

    // Étape 5
    message: ''
  };

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const annonceId = Number(this.route.snapshot.paramMap.get('id'));
    console.log('ID reçu =', annonceId);

    if (!annonceId || Number.isNaN(annonceId)) {
      console.error('ID annonce introuvable dans l URL');
      return;
    }

    this.chargerAnnonce(annonceId);
    this.chargerUtilisateurConnecte();
  }

  chargerAnnonce(id: number): void {
    this.http.get<any>(`${this.API}/annonces/${id}`).subscribe({
      next: (a: any) => {
        console.log('Annonce reçue =', a);

        this.annonce = {
          id: a.idAnnonce,
          titre: a.titre,
          adresse: `${a.adresse?.rue ?? ''}, ${a.adresse?.codePostal ?? ''} ${a.adresse?.ville ?? ''}`.trim(),
          prix: a.prixMensuel,
          typeLocation: a.modeLocation,
          quartier: a.adresse?.ville ?? '',
          nombreChambres: a.chambres?.length ?? 0,
          surface: a.surface,
          imageUrl: a.photos?.[0]?.url ?? ''
        };
      },
      error: () => console.warn('Annonce introuvable')
    });
  }

  nextStep(): void {
    if (!this.validerEtape(this.currentStep)) {
      return;
    }

    if (this.currentStep < 5) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  selectionnerTypeVisite(type: string): void {
    const valeur = type as TypeVisiteValue;
    this.form.typeVisite = valeur;

    if (valeur === 'SUR_PLACE') {
      this.form.formatVisite = null;
    } else if (!this.form.formatVisite) {
      this.form.formatVisite = 'DIRECT';
    }
  }

  selectionnerFormatVisite(format: string): void {
    this.form.formatVisite = format as FormatVisiteValue;
  }

  selectionnerMomentVisite(moment: string): void {
    this.form.momentVisite = moment;
  }

  toggleJour(jour: string): void {
    const idx = this.form.joursDisponibles.indexOf(jour);
    if (idx >= 0) {
      this.form.joursDisponibles.splice(idx, 1);
    } else {
      this.form.joursDisponibles.push(jour);
    }
  }

  autofill(): void {
    if (!this.utilisateurConnecte) return;

    this.form.prenom = this.utilisateurConnecte.prenom ?? '';
    this.form.nom = this.utilisateurConnecte.nom ?? '';
    this.form.email = this.utilisateurConnecte.email ?? '';
    this.form.telephone = this.utilisateurConnecte.telephone ?? '';
  }

  voirAnnonce(): void {
    if (this.annonce) {
      this.router.navigate(['/annonces', this.annonce.id]);
    }
  }

  soumettreDemande(): void {
    if (!this.annonce || !this.utilisateurConnecte?.id) return;

    for (let i = 1; i <= 5; i++) {
      if (!this.validerEtape(i)) {
        this.currentStep = i;
        return;
      }
    }
    if (this.form.typeVisite === 'SUR_PLACE') {
      this.form.formatVisite = null;
    }

    this.loading = true;

    const payload = {
      annonceId: this.annonce.id,
      etudiantId: this.utilisateurConnecte.id,

      messageCandidat: this.form.message || '',
      nombrePersonnes: this.form.nombrePersonnes ? Number(this.form.nombrePersonnes) : 1,

      dateEntree: this.form.dateEntree || null,
      dureeLocation: this.form.dureeLocation || null,
      budget: this.form.budgetMax ?? null,
      villeActuelle: this.form.villeActuelle || null,
      criterePrincipal: this.form.criteresPrincipaux.length
        ? this.form.criteresPrincipaux.join(',')
        : null,
      besoinPrincipal: this.form.besoinPrincipal || null,
      remarqueLogement: this.form.remarqueLogement || null,

      typeVisite: this.form.typeVisite || null,
      formatVisite: this.form.formatVisite || null,
      momentVisite: this.form.momentVisite || null,

      dateSouhaitee: this.form.visiteDate || null,
      joursDisponibles: this.form.joursDisponibles.length
        ? this.form.joursDisponibles.join(',')
        : null,
      plageHoraire: this.form.plageHoraire || null,
      remarqueDisponibilite: this.form.remarqueDispo || null
    };

    console.log('Payload demande =', payload);

    this.http.post<any>(`${this.API}/demandes`, payload).subscribe({
      next: (res) => {
        console.log('Demande créée =', res);
        this.demandeId = res.idDemande ?? res.id;
        this.loading = false;
        this.currentStep = 6;
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Erreur création demande =', err);
        console.error('Status =', err?.status);
        console.error('Message backend =', err?.error);

        let message = 'La demande n’a pas été enregistrée.';

        if (typeof err === 'string' && err.trim()) {
          message = err;
        } else if (typeof err?.error === 'string' && err.error.trim()) {
          message = err.error;
        } else if (err?.error?.message) {
          message = err.error.message;
        } else if (err?.message) {
          message = err.message;
        }

        alert(message);
      }
    });
  }

  telechargerPdf(): void {
    if (!this.demandeId) {
      alert('demandeId introuvable');
      return;
    }

    this.http.get(`${this.API}/demandes/${this.demandeId}/pdf`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL, '_blank');
      },
      error: (err) => {
        console.error('Erreur téléchargement PDF =', err);
        alert('Impossible de télécharger le PDF.');
      }
    });
  }

  chargerUtilisateurConnecte(): void {
    const raw = localStorage.getItem('utilisateur');

    if (!raw) {
      console.warn('Aucun utilisateur connecté');
      return;
    }

    this.utilisateurConnecte = JSON.parse(raw);
    console.log('Utilisateur récupéré =', this.utilisateurConnecte);

    this.form.prenom = this.utilisateurConnecte.prenom ?? '';
    this.form.nom = this.utilisateurConnecte.nom ?? '';
    this.form.email = this.utilisateurConnecte.email ?? '';
    this.form.telephone = this.utilisateurConnecte.telephone ?? '';

    if (this.utilisateurConnecte.role === 'ETUDIANT' && this.utilisateurConnecte.id) {
      this.chargerProfilEtudiant(this.utilisateurConnecte.id);
    }
  }

  chargerProfilEtudiant(utilisateurId: number): void {
    this.http.get<ProfilEtudiantDTO>(`${this.API}/profil-etudiant/utilisateur/${utilisateurId}`).subscribe({
      next: (profil) => {
        console.log('Profil étudiant =', profil);
        this.form.ecole = profil?.universite ?? '';
      },
      error: (err) => {
        console.warn('Profil étudiant introuvable', err);
        this.form.ecole = '';
      }
    });
  }

  validerEtape(etape: number): boolean {
    this.erreurs = {};

    if (etape === 1) {
      if (!this.form.prenom.trim()) {
        this.erreurs['prenom'] = 'Le prénom est obligatoire.';
      }

      if (!this.form.nom.trim()) {
        this.erreurs['nom'] = 'Le nom est obligatoire.';
      }

      if (!this.form.email.trim()) {
        this.erreurs['email'] = 'L’email est obligatoire.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim())) {
        this.erreurs['email'] = 'Veuillez saisir un email valide.';
      }

      if (!this.form.telephone.trim()) {
        this.erreurs['telephone'] = 'Le téléphone est obligatoire.';
      } else if (!/^[0-9+\s]{8,15}$/.test(this.form.telephone.trim())) {
        this.erreurs['telephone'] = 'Veuillez saisir un numéro valide.';
      }

      if (!this.form.ecole.trim()) {
        this.erreurs['ecole'] = 'L’établissement est obligatoire.';
      }
    }

    if (etape === 2) {
      if (!this.form.nombrePersonnes) {
        this.erreurs['nombrePersonnes'] = 'Le nombre de personnes est obligatoire.';
      }

      if (!this.form.dateEntree) {
        this.erreurs['dateEntree'] = 'La date d’entrée est obligatoire.';
      } else if (this.form.dateEntree < this.dateAujourdhui) {
        this.erreurs['dateEntree'] = 'La date d’entrée ne peut pas être dans le passé.';
      }

      if (!this.form.dureeLocation) {
        this.erreurs['dureeLocation'] = 'La durée de location est obligatoire.';
      }

      if (this.form.budgetMax === null || this.form.budgetMax <= 0) {
        this.erreurs['budgetMax'] = 'Le budget doit être supérieur à 0.';
      }

      if (!this.form.villeActuelle.trim()) {
        this.erreurs['villeActuelle'] = 'La ville actuelle est obligatoire.';
      }

      if (this.form.criteresPrincipaux.length === 0) {
        this.erreurs['criteresPrincipaux'] = 'Choisissez au moins un critère.';
      }

      if (!this.form.besoinPrincipal) {
        this.erreurs['besoinPrincipal'] = 'Choisissez le besoin principal.';
      }
    }

    if (etape === 3) {
      if (!this.form.typeVisite) {
        this.erreurs['typeVisite'] = 'Choisissez le type de visite.';
      }

      if (this.form.typeVisite === 'EN_LIGNE' && !this.form.formatVisite) {
        this.erreurs['formatVisite'] = 'Choisissez le format de visite en ligne.';
      }

      if (!this.form.momentVisite) {
        this.erreurs['momentVisite'] = 'Choisissez le moment préféré.';
      }
    }

    if (etape === 4) {
      if (!this.form.visiteDate) {
        this.erreurs['visiteDate'] = 'La date souhaitée est obligatoire.';
      } else if (this.form.visiteDate < this.dateAujourdhui) {
        this.erreurs['visiteDate'] = 'La date de visite ne peut pas être dans le passé.';
      }

      if (!this.form.plageHoraire) {
        this.erreurs['plageHoraire'] = 'La plage horaire est obligatoire.';
      }

      if (this.form.joursDisponibles.length === 0) {
        this.erreurs['joursDisponibles'] = 'Choisissez au moins un jour disponible.';
      }
    }

    if (etape === 5) {
      if (!this.form.message.trim()) {
        this.erreurs['message'] = 'Le message au propriétaire est obligatoire.';
      } else if (this.form.message.trim().length < 20) {
        this.erreurs['message'] = 'Le message doit contenir au moins 20 caractères.';
      }
    }

    return Object.keys(this.erreurs).length === 0;
  }

  toggleCritere(critere: string): void {
    const index = this.form.criteresPrincipaux.indexOf(critere);

    if (index >= 0) {
      this.form.criteresPrincipaux.splice(index, 1);
    } else {
      this.form.criteresPrincipaux.push(critere);
    }
  }
}
