import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DemandeServiceService } from '../../../../core/services/demande-service.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AppelService } from '../../../../core/services/appel.service';
import { DemandeServiceResponse } from '../../../../core/models/demande-service.model';
import { Utilisateur } from '../../../../core/models/utilisateur.model';
import { StatutAppel } from '../../../../core/models/appel.model';

@Component({
  selector: 'app-services-prestataire',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './services-prestataire.component.html',
  styleUrls: ['./services-prestataire.component.css']
})
export class ServicesPrestataireComponent implements OnInit {
  utilisateur: Utilisateur | null = null;
  demandes: DemandeServiceResponse[] = [];
  chargement = true;

  demandeSelectionnee: DemandeServiceResponse | null = null;
  traitement = false;

  recherche = '';
  filtreDate = '';
  pageActuelle = 1;
  readonly demandesParPage = 5;

  // ── Appel ────────────────────────────────────────────────────────
  statutAppel: StatutAppel = 'INACTIF';
  appelEnCoursPour = '';

  constructor(
    private demandeService: DemandeServiceService,
    private authService: AuthService,
    private appelService: AppelService
  ) {}

  ngOnInit(): void {
    this.utilisateur = this.authService.getSnapshot();
    this.charger();

    // Écouter le statut de l'appel
    this.appelService.statut$.subscribe(s => {
      this.statutAppel = s;
      if (s === 'INACTIF') this.appelEnCoursPour = '';
    });
  }

  // ── Initier un appel vers le demandeur ───────────────────────────
  async appelerDemandeur(demande: DemandeServiceResponse): Promise<void> {
    if (this.statutAppel !== 'INACTIF') return;
    this.appelEnCoursPour = demande.demandeurEmail;
    await this.appelService.initierAppel(demande.demandeurEmail);
  }

  charger(): void {
    this.demandeService.demandesRecues().subscribe({
      next: (data) => { this.demandes = data; this.chargement = false; },
      error: () => { this.chargement = false; }
    });
  }

  ouvrirDetail(demande: DemandeServiceResponse): void {
    this.demandeSelectionnee = demande;
  }

  fermerDetail(): void {
    this.demandeSelectionnee = null;
  }

  accepter(): void {
    if (!this.demandeSelectionnee) return;
    this.traitement = true;
    this.demandeService.accepter(this.demandeSelectionnee.id).subscribe({
      next: (d) => {
        this.mettreAJourDemande(d);
        this.traitement = false;
        this.fermerDetail();
      },
      error: () => { this.traitement = false; }
    });
  }

  refuser(): void {
    if (!this.demandeSelectionnee) return;
    this.traitement = true;
    this.demandeService.refuser(this.demandeSelectionnee.id).subscribe({
      next: (d) => {
        this.mettreAJourDemande(d);
        this.traitement = false;
        this.fermerDetail();
      },
      error: () => { this.traitement = false; }
    });
  }

  mettreAJourDemande(updated: DemandeServiceResponse): void {
    const idx = this.demandes.findIndex(d => d.id === updated.id);
    if (idx !== -1) this.demandes[idx] = updated;
  }

  getPhoto(): string {
    return this.utilisateur?.photoProfil
      ? this.demandeService.getPhotoUrl(this.utilisateur.photoProfil)
      : '';
  }

  compterStatut(statut: string): number {
    return this.demandes.filter(d => d.statut === statut).length;
  }

  get demandesTriees(): DemandeServiceResponse[] {
    return [...this.demandes].sort((a, b) => {
      const dateA = new Date(`${a.dateService}T${a.heureService}`).getTime();
      const dateB = new Date(`${b.dateService}T${b.heureService}`).getTime();
      return dateA - dateB;
    });
  }

  get demandesFiltrees(): DemandeServiceResponse[] {
    const texte = this.recherche.trim().toLowerCase();
    return this.demandesTriees.filter(d => {
      const matchRecherche =
        !texte ||
        `${d.demandeurPrenom} ${d.demandeurNom}`.toLowerCase().includes(texte) ||
        (d.demandeurEmail || '').toLowerCase().includes(texte) ||
        (d.demandeurTelephone || '').toLowerCase().includes(texte) ||
        (d.adresse || '').toLowerCase().includes(texte) ||
        (d.ville || '').toLowerCase().includes(texte) ||
        (d.probleme || '').toLowerCase().includes(texte);
      const matchDate = !this.filtreDate || d.dateService === this.filtreDate;
      return matchRecherche && matchDate;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.demandesFiltrees.length / this.demandesParPage));
  }

  get demandesPage(): DemandeServiceResponse[] {
    const debut = (this.pageActuelle - 1) * this.demandesParPage;
    return this.demandesFiltrees.slice(debut, debut + this.demandesParPage);
  }

  pagePrecedente(): void { if (this.pageActuelle > 1) this.pageActuelle--; }
  pageSuivante(): void   { if (this.pageActuelle < this.totalPages) this.pageActuelle++; }
  resetPagination(): void { this.pageActuelle = 1; }
  viderFiltres(): void { this.recherche = ''; this.filtreDate = ''; this.pageActuelle = 1; }

  get prochaineDemande(): DemandeServiceResponse | null {
    const now = Date.now();
    const futures = this.demandesTriees.filter(d => {
      const time = new Date(`${d.dateService}T${d.heureService}`).getTime();
      return d.statut !== 'REFUSEE' && time >= now;
    });
    if (futures.length > 0) return futures[0];
    const nonRefusees = this.demandesTriees.filter(d => d.statut !== 'REFUSEE');
    return nonRefusees.length > 0 ? nonRefusees[0] : null;
  }

  statutLabel(statut: string): string {
    if (statut === 'EN_ATTENTE') return 'En attente';
    if (statut === 'ACCEPTEE')   return 'Acceptée';
    return 'Refusée';
  }

  getStatutClass(statut: string): string { return statut.toLowerCase(); }
}
