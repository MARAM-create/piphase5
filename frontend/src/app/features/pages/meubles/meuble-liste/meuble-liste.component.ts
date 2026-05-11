import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MeubleService } from '../../../../core/services/meuble.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DemandeServiceService } from '../../../../core/services/demande-service.service';
import { Meuble } from '../../../../core/models/meuble.model';
import { ProfilPrestataireDTO } from '../../../../core/models/demande-service.model';
import {
  FilterSidebarComponent,
  MeubleFilters
} from '../filter-sidebar/filter-sidebar';

@Component({
  selector: 'app-meuble-liste',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FilterSidebarComponent],
  templateUrl: './meuble-list.component.html',
  styleUrls: ['./meuble-list.component.css']
})
export class MeubleListeComponent implements OnInit {
  meubles: Meuble[] = [];
  meublesFiltres: Meuble[] = [];
  chargement = true;
  erreur = '';
  utilisateurId: number | null = null;

  selectedSort: 'recent' | 'priceAsc' | 'priceDesc' = 'recent';

  currentFilters: MeubleFilters = {
    categorie: '',
    etat: '',
    minPrix: 0,
    maxPrix: 2500
  };

  // Modal achat
  modalAchatOuvert = false;
  meubleSelectionne: Meuble | null = null;
  etape: 'confirmation' | 'prestataire' = 'confirmation';
  prestatairesDemo: ProfilPrestataireDTO[] = [];
  chargementPrestataires = false;
  achatEnCours = false;
  achatSucces = false;
  achatErreur = '';

  constructor(
    private meubleService: MeubleService,
    private authService: AuthService,
    private demandeService: DemandeServiceService
  ) {}

  ngOnInit(): void {
    this.utilisateurId = this.authService.getSnapshot()?.id ?? null;
    this.charger();
  }

  charger(): void {
    this.meubleService.listerMeubles().subscribe({
      next: (data) => {
        this.meubles = data;
        this.meublesFiltres = [...data];
        this.applySort();
        this.chargement = false;
      },
      error: () => {
        this.erreur = 'Erreur lors du chargement';
        this.chargement = false;
      }
    });
  }

  getPhotoUrl(photo: string): string {
    return this.meubleService.getPhotoUrl(photo);
  }

  estMonMeuble(meuble: Meuble): boolean {
    return this.utilisateurId === meuble.vendeurId;
  }

  // Bouton "Conseils & Guide" : descend vers la dernière section de la même page
  allerAuGuide(): void {
    const section = document.getElementById('guide-assistance');

    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  // ── Ouvrir modal achat ──────────────────────────────
  ouvrirModalAchat(meuble: Meuble): void {
    this.meubleSelectionne = meuble;
    this.modalAchatOuvert = true;
    this.etape = 'confirmation';
    this.achatSucces = false;
    this.achatErreur = '';
  }

  fermerModalAchat(): void {
    this.modalAchatOuvert = false;
    this.meubleSelectionne = null;
    this.prestatairesDemo = [];
  }

  // ── Etape 1 : Confirmer l'achat ─────────────────────
  confirmerAchat(): void {
    if (!this.meubleSelectionne) return;

    this.achatEnCours = true;
    this.achatErreur = '';

    this.meubleService.acheterMeuble(this.meubleSelectionne.id).subscribe({
      next: () => {
        this.meubleSelectionne!.statut = 'VENDU';
        this.achatEnCours = false;
        this.etape = 'prestataire';
        this.chargerPrestataires();
      },
      error: (e: any) => {
        this.achatErreur = e.error?.message || 'Erreur lors de l\'achat';
        this.achatEnCours = false;
      }
    });
  }

  // ── Charger prestataires déménagement ───────────────
  chargerPrestataires(): void {
    this.chargementPrestataires = true;

    this.meubleService.getPrestatairesDemo().subscribe({
      next: (data: ProfilPrestataireDTO[]) => {
        this.prestatairesDemo = data;
        this.chargementPrestataires = false;
      },
      error: () => {
        this.prestatairesDemo = [];
        this.chargementPrestataires = false;
      }
    });
  }

  // ── Etape 2 : Choisir prestataire ──────────────────
  choisirPrestataire(p: ProfilPrestataireDTO): void {
    if (!this.meubleSelectionne) return;

    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    const dateStr = demain.toISOString().split('T')[0];

    const data = {
      prestataireId: p.utilisateurId,
      dateService: dateStr,
      heureService: '09:00',
      probleme: `MEUBLE:${this.meubleSelectionne.titre}`,
      adresse: '',
      ville: this.meubleSelectionne.ville || ''
    };

    this.demandeService.envoyerDemande(data).subscribe({
      next: () => {
        this.achatSucces = true;
      },
      error: () => {
        this.achatSucces = true;
      }
    });
  }

  // ── Etape 2 : Sans transporteur ────────────────────
  sansTransporteur(): void {
    if (!this.meubleSelectionne) return;

    this.meubleService.envoyerRecuSansTransport(this.meubleSelectionne.id)
      .subscribe({ error: () => {} });

    this.achatSucces = true;
  }

  getPhotoPrestataire(photo: string): string {
    return photo ? this.demandeService.getPhotoUrl(photo) : '';
  }

  // ── Filtres et tri ──────────────────────────────────
  private normalizeText(value: string | null | undefined): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }

  private normalizeCategorie(value: string | null | undefined): string {
    const n = this.normalizeText(value);

    const map: Record<string, string> = {
      'LIT': 'LIT',
      'LITS': 'LIT',
      'BUREAU': 'BUREAU',
      'BUREAUX': 'BUREAU',
      'CHAISE': 'CHAISE',
      'CHAISES': 'CHAISE',
      'ARMOIRE': 'ARMOIRE',
      'ARMOIRES': 'ARMOIRE',
      'CANAPE': 'CANAPE',
      'CANAPES': 'CANAPE',
      'TABLE': 'TABLE',
      'TABLES': 'TABLE',
      'ETAGERE': 'ETAGERE',
      'ETAGERES': 'ETAGERE',
      'AUTRE': 'AUTRE'
    };

    return map[n] || n;
  }

  private normalizeEtat(value: string | null | undefined): string {
    return this.normalizeText(value);
  }

  private getMeublesComparables(
    cat: string | null | undefined,
    etat: string | null | undefined
  ): Meuble[] {
    return this.meubles.filter(m =>
      this.normalizeCategorie(m.categorie) === this.normalizeCategorie(cat) &&
      this.normalizeEtat(m.etat) === this.normalizeEtat(etat) &&
      Number(m.prix) > 0 &&
      m.statut === 'DISPONIBLE'
    );
  }

  private getPrixMedian(
    cat: string | null | undefined,
    etat: string | null | undefined
  ): number {
    const prix = this.getMeublesComparables(cat, etat)
      .map(m => Number(m.prix))
      .sort((a, b) => a - b);

    if (!prix.length) return 0;

    const mid = Math.floor(prix.length / 2);

    return prix.length % 2 === 0
      ? (prix[mid - 1] + prix[mid]) / 2
      : prix[mid];
  }

  getPrixBadgeLabel(meuble: Meuble): string {
    const comp = this.getMeublesComparables(meuble.categorie, meuble.etat);

    if (comp.length < 2) return 'Prix à comparer';

    const median = this.getPrixMedian(meuble.categorie, meuble.etat);
    const prix = Number(meuble.prix);

    if (prix <= median * 0.8) return 'Très bon prix';
    if (prix <= median * 0.95) return 'Bon prix';
    if (prix <= median * 1.1) return 'Prix correct';
    if (prix <= median * 1.25) return 'Un peu cher';

    return 'Très cher';
  }

  getPrixBadgeClass(meuble: Meuble): string {
    const label = this.getPrixBadgeLabel(meuble);

    const map: Record<string, string> = {
      'Très bon prix': 'prix-badge tres-bon',
      'Bon prix': 'prix-badge bon',
      'Prix correct': 'prix-badge correct',
      'Un peu cher': 'prix-badge un-peu-cher',
      'Très cher': 'prix-badge tres-cher'
    };

    return map[label] || 'prix-badge a-comparer';
  }

  onFiltersChange(filters: MeubleFilters): void {
    this.currentFilters = filters;

    this.meublesFiltres = this.meubles.filter(m => {
      const matchCat =
        !this.normalizeCategorie(filters.categorie) ||
        this.normalizeCategorie(m.categorie) === this.normalizeCategorie(filters.categorie);

      const matchEtat = !filters.etat || m.etat === filters.etat;
      const matchMin = m.prix >= filters.minPrix;
      const matchMax = m.prix <= filters.maxPrix;

      return matchCat && matchEtat && matchMin && matchMax;
    });

    this.applySort();
  }

  onSortChange(): void {
    this.applySort();
  }

  private applySort(): void {
    this.meublesFiltres = [...this.meublesFiltres].sort((a, b) => {
      if (this.selectedSort === 'priceAsc') return a.prix - b.prix;
      if (this.selectedSort === 'priceDesc') return b.prix - a.prix;

      return b.id - a.id;
    });
  }
}
