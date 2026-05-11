import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContratService } from '../../../../../core/services/contrat.service';
import { Contrat } from '../../../../../core/models/contrat.model';
import { StatutContrat } from '../../../../../core/models/enums.model';

@Component({
  selector: 'app-admin-contrats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-contrats.component.html',
  styleUrl: './admin-contrats.component.scss'
})
export class AdminContratsComponent implements OnInit {

  private contratService = inject(ContratService);
  private router = inject(Router);

  // ── State ──────────────────────────────────────
  contrats: Contrat[] = [];
  contratsFiltres: Contrat[] = [];
  chargement = true;
  erreur: string | null = null;

  // ── Filters ────────────────────────────────────
  recherche = '';
  filtreStatut = '';

  // ── Delete modal ───────────────────────────────
  afficherConfirmation = false;
  idASupprimer: number | null = null;
  suppressionEnCours = false;

  // ── Statut options ─────────────────────────────
  readonly statutOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: StatutContrat.ACTIF, label: '🟢 Actif' },
    { value: StatutContrat.VALIDE, label: '✅ Validé' },
    { value: StatutContrat.EN_ATTENTE, label: '⏳ En attente' },
    { value: StatutContrat.ANNULE, label: '🔴 Annulé' }
  ];

  readonly today = new Date().toISOString().slice(0, 10);

  ngOnInit(): void {
    this.chargerContrats();
  }

  chargerContrats(): void {
    this.chargement = true;
    this.erreur = null;
    this.contratService.getAllContrats().subscribe({
      next: (data) => {
        this.contrats = data;
        this.appliquerFiltres();
        this.chargement = false;
      },
      error: () => {
        this.erreur = 'Impossible de charger les contrats. Vérifiez l\'API.';
        this.chargement = false;
      }
    });
  }

  appliquerFiltres(): void {
    const terme = this.recherche.toLowerCase().trim();
    this.contratsFiltres = this.contrats.filter(c => {
      const texte = terme === '' ||
        c.locataireFullName?.toLowerCase().includes(terme) ||
        c.bailleurFullName?.toLowerCase().includes(terme) ||
        c.annonceTitre?.toLowerCase().includes(terme) ||
        String(c.id).includes(terme);
      const statut = this.filtreStatut === '' || c.statutContrat === this.filtreStatut;
      return texte && statut;
    });
  }

  ouvrirConfirmation(id: number, event: Event): void {
    event.stopPropagation();
    this.idASupprimer = id;
    this.afficherConfirmation = true;
  }

  annulerSuppression(): void {
    this.afficherConfirmation = false;
    this.idASupprimer = null;
  }

  confirmerSuppression(): void {
    if (!this.idASupprimer) return;
    this.suppressionEnCours = true;
    this.contratService.supprimerContrat(this.idASupprimer).subscribe({
      next: () => {
        this.contrats = this.contrats.filter(c => c.id !== this.idASupprimer);
        this.appliquerFiltres();
        this.suppressionEnCours = false;
        this.afficherConfirmation = false;
        this.idASupprimer = null;
      },
      error: () => { this.suppressionEnCours = false; }
    });
  }

  retourAdmin(): void {
    this.router.navigate(['/tableau-de-bord/admin']);
  }

  // ── Helpers ────────────────────────────────────
  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getStatutLabel(s: StatutContrat): string {
    const map: Record<string, string> = {
      [StatutContrat.ACTIF]: '🟢 Actif',
      [StatutContrat.VALIDE]: '✅ Validé',
      [StatutContrat.EN_ATTENTE]: '⏳ En attente',
      [StatutContrat.EN_ATTENTE_PAIEMENT]: '💳 Att. paiement',
      [StatutContrat.EN_COURS_ANALYSE]: '🔍 Analyse IA',
      [StatutContrat.ANNULE]: '🔴 Annulé',
      [StatutContrat.BROUILLON]: '📝 Brouillon'
    };
    return map[s] ?? s;
  }

  getStatutClass(s: StatutContrat): string {
    const map: Record<string, string> = {
      [StatutContrat.ACTIF]:              'ac-badge ac-badge--success',
      [StatutContrat.VALIDE]:             'ac-badge ac-badge--success',
      [StatutContrat.EN_ATTENTE]:         'ac-badge ac-badge--warning',
      [StatutContrat.EN_ATTENTE_PAIEMENT]:'ac-badge ac-badge--warning',
      [StatutContrat.EN_COURS_ANALYSE]:   'ac-badge ac-badge--info',
      [StatutContrat.ANNULE]:             'ac-badge ac-badge--danger',
      [StatutContrat.BROUILLON]:          'ac-badge ac-badge--neutral'
    };
    return map[s] ?? 'ac-badge ac-badge--neutral';
  }

  getSignedLabel(url: string | null): string {
    return url ? '✅ Signé' : '⏳ Non signé';
  }

  getInitiales(nom: string): string {
    return (nom ?? '??').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }

  getScanUrl(imageScanneUrl: string | null): string {
    if (!imageScanneUrl) return '';
    // If already a full URL (e.g. http://...), return as-is
    if (imageScanneUrl.startsWith('http')) return imageScanneUrl;
    // Extract just the filename (strip any path prefix)
    const filename = imageScanneUrl.split(/[/\\]/).pop() || imageScanneUrl;
    return `http://192.168.1.175:30808/uploads/scans/${filename}`;
  }

  trackById(_: number, c: Contrat): number { return c.id; }
}
