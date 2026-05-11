import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { DemandeServiceService } from '../../../../core/services/demande-service.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ProfilPrestataireDTO, DisponibiliteDTO } from '../../../../core/models/demande-service.model';
import { Utilisateur } from '../../../../core/models/utilisateur.model';
import { AppelService } from '../../../../core/services/appel.service';
import { StatutAppel } from '../../../../core/models/appel.model';

interface JourCalendrier {
  date: Date;
  jourMois: number;
  estMoisActuel: boolean;
  statut: 'LIBRE' | 'EN_ATTENTE' | 'ACCEPTEE';
}

@Component({
  selector: 'app-services-liste',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './services-liste.component.html',
  styleUrls: ['./services-liste.component.css']
})
export class ServicesListeComponent implements OnInit {
  prestataires: ProfilPrestataireDTO[] = [];
  prestatairesFiltres: ProfilPrestataireDTO[] = [];
  chargement = true;
  erreur = '';
  utilisateur: Utilisateur | null = null;
  villeAuto = '';
  adresseAuto = '';
  statutAppel: StatutAppel = 'INACTIF';

  recherche = '';
  filtreVille = '';
  triSelectionne = 'EXPERIENCE';

  // Modal demande
  modalOuvert = false;
  prestataireSelectionne: ProfilPrestataireDTO | null = null;
  form!: FormGroup;
  envoi = false;
  erreurEnvoi = '';
  succesEnvoi = false;
  today = new Date().toISOString().split('T')[0];

  // Modal calendrier disponibilités
  calendrierOuvert = false;
  prestataireCalendrier: ProfilPrestataireDTO | null = null;
  disponibilites: DisponibiliteDTO[] = [];
  chargementCalendrier = false;
  moisAffiche = new Date();
  joursCalendrier: JourCalendrier[] = [];
  joursNoms = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  moisNoms = ['Janvier','Février','Mars','Avril','Mai','Juin',
    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  jourSelectionne: JourCalendrier | null = null;

  filtreSpecialite = 'TOUS';
  categoriesServices = [
    { label: 'Tout', value: 'TOUS', icon: '◉' },
    { label: 'Déménagement', value: 'DEMENAGEMENT', icon: '↔' },
    { label: 'Nettoyage', value: 'NETTOYAGE', icon: '✦' },
    { label: 'Bricolage', value: 'BRICOLAGE', icon: '🛠' },
    { label: 'Plomberie', value: 'PLOMBERIE', icon: '⌁' },
    { label: 'Électricité', value: 'ELECTRICITE', icon: '⚡' },
    { label: 'Peinture', value: 'PEINTURE', icon: '◧' },
    { label: 'Autre', value: 'AUTRE', icon: '+' }
  ];

  constructor(
    private demandeService: DemandeServiceService,
    private authService: AuthService,
    private fb: FormBuilder,
    private appelService: AppelService
  ) {}

  ngOnInit(): void {
    this.utilisateur = this.authService.getSnapshot();
    this.appelService.statut$.subscribe(s => this.statutAppel = s);

    this.form = this.fb.group({
      dateService: ['', Validators.required],
      heureService: ['', Validators.required],
      probleme: ['', Validators.required],
      adresse: [''],
      ville: ['']
    });

    this.demandeService.getMonProfil().subscribe({
      next: (profil) => {
        this.villeAuto = profil.ville;
        this.adresseAuto = profil.adresse;
      },
      error: () => {}
    });

    this.charger();
  }

  charger(): void {
    this.chargement = true;
    this.demandeService.listerPrestataires().subscribe({
      next: (data) => {
        this.prestataires = this.trierPrestatairesAvecMonProfilEnPremier(data);
        this.appliquerFiltre();
        this.chargement = false;
      },
      error: () => {
        this.erreur = 'Erreur de chargement';
        this.chargement = false;
      }
    });
  }

  appliquerFiltre(): void {
    let liste = [...this.prestataires];

    if (this.filtreSpecialite !== 'TOUS') {
      liste = liste.filter(p =>
        this.normaliserSpecialite(p.specialite) === this.filtreSpecialite
      );
    }

    const rechercheNormale = this.normalizeText(this.recherche);
    if (rechercheNormale) {
      liste = liste.filter(p => {
        const contenu = this.normalizeText(
          `${p.prenom} ${p.nom} ${p.specialite || ''} ${p.ville || ''} ${p.email || ''} ${p.certifications || ''}`
        );
        return contenu.includes(rechercheNormale);
      });
    }

    const villeNormale = this.normalizeText(this.filtreVille);
    if (villeNormale) {
      liste = liste.filter(p =>
        this.normalizeText(p.ville || '').includes(villeNormale)
      );
    }

    liste.sort((a, b) => {
      const aEstMoi = this.estMonProfil(a) ? 1 : 0;
      const bEstMoi = this.estMonProfil(b) ? 1 : 0;

      if (aEstMoi !== bEstMoi) return bEstMoi - aEstMoi;

      if (this.triSelectionne === 'EXPERIENCE') {
        return (b.experienceAnnees || 0) - (a.experienceAnnees || 0);
      }

      if (this.triSelectionne === 'TARIF_ASC') {
        return (a.tarifHoraire || 0) - (b.tarifHoraire || 0);
      }

      if (this.triSelectionne === 'TARIF_DESC') {
        return (b.tarifHoraire || 0) - (a.tarifHoraire || 0);
      }

      return (a.prenom + ' ' + a.nom).localeCompare(b.prenom + ' ' + b.nom);
    });

    this.prestatairesFiltres = liste;
  }

  choisirCategorie(value: string): void {
    this.filtreSpecialite = value;
    this.appliquerFiltre();
  }

  onRechercheChange(): void {
    this.appliquerFiltre();
  }

  onVilleChange(): void {
    this.appliquerFiltre();
  }

  onTriChange(): void {
    this.appliquerFiltre();
  }

  reinitialiserFiltres(): void {
    this.filtreSpecialite = 'TOUS';
    this.recherche = '';
    this.filtreVille = '';
    this.triSelectionne = 'EXPERIENCE';
    this.appliquerFiltre();
  }

  normaliserSpecialite(value?: string | null): string {
    const s = (value || '').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();

    if (s.includes('DEMENAGEMENT')) return 'DEMENAGEMENT';
    if (s.includes('NETTOYAGE')) return 'NETTOYAGE';
    if (s.includes('BRICOLAGE')) return 'BRICOLAGE';
    if (s.includes('PLOMBERIE')) return 'PLOMBERIE';
    if (s.includes('ELECTRICITE')) return 'ELECTRICITE';
    if (s.includes('PEINTURE')) return 'PEINTURE';
    return 'AUTRE';
  }

  normalizeText(value: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  getPhoto(photo: string): string {
    return photo ? this.demandeService.getPhotoUrl(photo) : '';
  }

  estMonProfil(p: ProfilPrestataireDTO): boolean {
    return this.utilisateur?.id === p.utilisateurId;
  }

  getInitiales(p: ProfilPrestataireDTO): string {
    return `${p.prenom?.[0] || ''}${p.nom?.[0] || ''}`.toUpperCase();
  }

  getSpecialiteLabel(p: ProfilPrestataireDTO): string {
    return p.specialite || 'Prestataire';
  }

  getDisponibiliteLabel(value?: string): string {
    if (!value) return 'Disponibilité non précisée';
    return value;
  }

  // Modal demande
  ouvrirModal(p: ProfilPrestataireDTO): void {
    this.prestataireSelectionne = p;
    this.modalOuvert = true;
    this.erreurEnvoi = '';
    this.succesEnvoi = false;

    this.form.reset({
      dateService: '',
      heureService: '',
      probleme: '',
      adresse: this.adresseAuto,
      ville: this.villeAuto
    });
  }

  fermerModal(): void {
    this.modalOuvert = false;
    this.prestataireSelectionne = null;
  }

  envoyer(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.prestataireSelectionne) return;

    this.envoi = true;
    this.erreurEnvoi = '';

    const data = {
      prestataireId: this.prestataireSelectionne.utilisateurId,
      ...this.form.value
    };

    this.demandeService.envoyerDemande(data).subscribe({
      next: () => {
        this.succesEnvoi = true;
        this.envoi = false;
        setTimeout(() => this.fermerModal(), 2000);
      },
      error: (e: any) => {
        this.erreurEnvoi = e.error?.message || 'Erreur lors de l’envoi';
        this.envoi = false;
      }
    });
  }

  // Calendrier
  ouvrirCalendrier(p: ProfilPrestataireDTO): void {
    this.prestataireCalendrier = p;
    this.calendrierOuvert = true;
    this.moisAffiche = new Date();
    this.jourSelectionne = null;
    this.chargementCalendrier = true;

    this.demandeService.getDisponibilites(p.utilisateurId).subscribe({
      next: (data) => {
        this.disponibilites = data;
        this.construireCalendrier();
        this.chargementCalendrier = false;
      },
      error: () => {
        this.disponibilites = [];
        this.construireCalendrier();
        this.chargementCalendrier = false;
      }
    });
  }

  fermerCalendrier(): void {
    this.calendrierOuvert = false;
    this.prestataireCalendrier = null;
    this.jourSelectionne = null;
  }

  construireCalendrier(): void {
    this.joursCalendrier = [];
    const annee = this.moisAffiche.getFullYear();
    const mois = this.moisAffiche.getMonth();

    const premierJour = new Date(annee, mois, 1);
    let decalage = premierJour.getDay() - 1;
    if (decalage < 0) decalage = 6;

    for (let i = decalage - 1; i >= 0; i--) {
      const d = new Date(annee, mois, -i);
      this.joursCalendrier.push({
        date: d,
        jourMois: d.getDate(),
        estMoisActuel: false,
        statut: 'LIBRE'
      });
    }

    const dernierJour = new Date(annee, mois + 1, 0);
    for (let i = 1; i <= dernierJour.getDate(); i++) {
      const d = new Date(annee, mois, i);
      this.joursCalendrier.push({
        date: d,
        jourMois: i,
        estMoisActuel: true,
        statut: this.getStatutJour(d)
      });
    }

    while (this.joursCalendrier.length < 42) {
      const d = new Date(
        annee,
        mois + 1,
        this.joursCalendrier.length - dernierJour.getDate() - decalage + 1
      );
      this.joursCalendrier.push({
        date: d,
        jourMois: d.getDate(),
        estMoisActuel: false,
        statut: 'LIBRE'
      });
    }
  }

  getStatutJour(date: Date): 'LIBRE' | 'EN_ATTENTE' | 'ACCEPTEE' {
    const dispo = this.disponibilites.find(d => {
      const [y, m, j] = d.dateService.split('-').map(Number);
      return y === date.getFullYear() &&
        m === date.getMonth() + 1 &&
        j === date.getDate();
    });

    if (!dispo) return 'LIBRE';
    return dispo.statut as 'EN_ATTENTE' | 'ACCEPTEE';
  }

  getDisposDuJour(date: Date): DisponibiliteDTO[] {
    return this.disponibilites.filter(d => {
      const [y, m, j] = d.dateService.split('-').map(Number);
      return y === date.getFullYear() &&
        m === date.getMonth() + 1 &&
        j === date.getDate();
    });
  }

  selectionnerJour(jour: JourCalendrier): void {
    if (!jour.estMoisActuel) return;
    this.jourSelectionne = jour;
  }

  moisPrecedent(): void {
    this.moisAffiche = new Date(
      this.moisAffiche.getFullYear(),
      this.moisAffiche.getMonth() - 1,
      1
    );
    this.construireCalendrier();
    this.jourSelectionne = null;
  }

  moisSuivant(): void {
    this.moisAffiche = new Date(
      this.moisAffiche.getFullYear(),
      this.moisAffiche.getMonth() + 1,
      1
    );
    this.construireCalendrier();
    this.jourSelectionne = null;
  }

  choisirCetteDateEtDemander(): void {
    if (!this.jourSelectionne || !this.prestataireCalendrier) return;

    const dateStr = this.jourSelectionne.date.toISOString().split('T')[0];
    const prestataire = this.prestataireCalendrier;

    this.fermerCalendrier();

    setTimeout(() => {
      this.prestataireSelectionne = prestataire;
      this.modalOuvert = true;
      this.erreurEnvoi = '';
      this.succesEnvoi = false;

      this.form.reset({
        dateService: dateStr,
        heureService: '',
        probleme: '',
        adresse: this.adresseAuto,
        ville: this.villeAuto
      });
    }, 100);
  }

  get titreCalendrier(): string {
    return `${this.moisNoms[this.moisAffiche.getMonth()]} ${this.moisAffiche.getFullYear()}`;
  }

  trierPrestatairesAvecMonProfilEnPremier(list: ProfilPrestataireDTO[]): ProfilPrestataireDTO[] {
    return [...list].sort((a, b) => {
      const aEstMoi = this.estMonProfil(a) ? 1 : 0;
      const bEstMoi = this.estMonProfil(b) ? 1 : 0;
      if (aEstMoi !== bEstMoi) return bEstMoi - aEstMoi;
      return 0;
    });
  }

  estAujourdhui(date: Date): boolean {
    const a = new Date();
    return date.getDate() === a.getDate()
      && date.getMonth() === a.getMonth()
      && date.getFullYear() === a.getFullYear();
  }

  async appeler(p: ProfilPrestataireDTO): Promise<void> {
    if (this.statutAppel !== 'INACTIF') return;
    await this.appelService.initierAppel(p.email);
  }

  get f() {
    return this.form.controls;
  }
}
