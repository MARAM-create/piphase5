import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ContratService } from '../../../core/services/contrat.service';
import { PaiementService } from '../../../core/services/paiement.service';
import { AuthService } from '../../../core/services/auth.service';
import { Contrat } from '../../../core/models/contrat.model';
import { Paiement } from '../../../core/models/paiement.model';
import { StatutPaiement } from '../../../core/models/enums.model';
import { environment } from '../../../../environments/environment';

interface ContratEtendu extends Contrat {
  totalPaye?: number;
  paiements?: Paiement[];
  calendrier?: string[];
  loadingDetails?: boolean;
}

@Component({
  selector: 'app-contract-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './contract-management.component.html',
  styleUrl: './contract-management.component.css'
})
export class ContractManagementComponent implements OnInit, OnDestroy {

  private contratService = inject(ContratService);
  private paiementService = inject(PaiementService);
  private authService = inject(AuthService);

  // ── État ─────────────────────────────────────────────────────────
  contrats: ContratEtendu[] = [];
  contratsFiltres: ContratEtendu[] = [];
  contratSelectionne: ContratEtendu | null = null;

  recherche = '';
  chargement = true;
  erreur: string | null = null;

  // Modale de confirmation de suppression
  afficherConfirmation = false;
  idASupprimer: number | null = null;
  suppressionEnCours = false;

  // Date du jour pour comparaison calendrier
  readonly today = new Date().toISOString().slice(0, 10);

  // Stats globales
  totalGeneralPaye = 0;

  // Auto-refresh
  private refreshInterval: any = null;

  ngOnInit(): void {
    this.chargerContrats();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  chargerContrats(): void {
    const utilisateur = this.authService.getSnapshot();
    if (!utilisateur?.id) {
      this.erreur = 'Utilisateur non connecté.';
      this.chargement = false;
      return;
    }

    this.chargement = true;
    this.contratService.getContratsActifsParBailleur(utilisateur.id).subscribe({
      next: (contrats) => {
        this.contrats = contrats;
        this.appliquerFiltre();
        this.chargement = false;
        this.calculerTotalGeneral();

        // Recharger les détails du contrat sélectionné si besoin
        if (this.contratSelectionne) {
          const updated = this.contrats.find(c => c.id === this.contratSelectionne!.id);
          if (updated) {
            // On garde les détails déjà chargés
            updated.totalPaye = this.contratSelectionne.totalPaye;
            updated.paiements = this.contratSelectionne.paiements;
            updated.calendrier = this.contratSelectionne.calendrier;
            updated.loadingDetails = this.contratSelectionne.loadingDetails;
            this.contratSelectionne = updated;
          }
        }

        // Lancer le polling pour détecter les changements de paiement
        this.lancerAutoRefresh();
      },
      error: () => {
        this.erreur = 'Impossible de charger les contrats.';
        this.chargement = false;
      }
    });
  }

  lancerAutoRefresh(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);

    this.refreshInterval = setInterval(() => {
      // Recharger si un contrat sélectionné a des paiements en attente
      if (this.contratSelectionne?.paiements?.some(p => p.statutPaiement === StatutPaiement.INITIE)) {
        this.rafraichirDetailsContrat(this.contratSelectionne);
      }
    }, 8000);
  }

  appliquerFiltre(): void {
    const terme = this.recherche.toLowerCase().trim();
    if (!terme) {
      this.contratsFiltres = [...this.contrats];
    } else {
      this.contratsFiltres = this.contrats.filter(c =>
        c.locataireFullName?.toLowerCase().includes(terme) ||
        c.annonceTitre?.toLowerCase().includes(terme) ||
        String(c.id).includes(terme)
      );
    }
  }

  selectionnerContrat(contrat: ContratEtendu): void {
    if (this.contratSelectionne?.id === contrat.id) {
      this.contratSelectionne = null;
      return;
    }
    this.contratSelectionne = contrat;

    if (contrat.loadingDetails === undefined) {
      this.rafraichirDetailsContrat(contrat);
    }
  }

  rafraichirDetailsContrat(contrat: ContratEtendu): void {
    contrat.loadingDetails = contrat.loadingDetails === undefined; // true seulement la 1re fois

    forkJoin({
      total: this.contratService.getTotalPayeParContrat(contrat.id).pipe(catchError(() => of({ totalPaye: 0 }))),
      paiements: this.contratService.getPaiementsParContrat(contrat.id).pipe(catchError(() => of([]))),
      calendrier: this.contratService.getCalendrierPaiements(contrat.id).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ total, paiements, calendrier }) => {
        contrat.totalPaye = total.totalPaye;
        contrat.paiements = paiements as Paiement[];
        contrat.calendrier = calendrier as string[];
        contrat.loadingDetails = false;
        this.calculerTotalGeneral();
      },
      error: () => { contrat.loadingDetails = false; }
    });
  }

  calculerTotalGeneral(): void {
    this.totalGeneralPaye = this.contrats
      .filter(c => c.totalPaye !== undefined)
      .reduce((acc, c) => acc + (c.totalPaye ?? 0), 0);
  }

  // ── Actions ─────────────────────────────────────────────────────
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
        if (this.contratSelectionne?.id === this.idASupprimer) {
          this.contratSelectionne = null;
        }
        this.appliquerFiltre();
        this.calculerTotalGeneral();
        this.suppressionEnCours = false;
        this.afficherConfirmation = false;
        this.idASupprimer = null;
      },
      error: () => { this.suppressionEnCours = false; }
    });
  }

  // ── Helpers de paiement ─────────────────────────────────────────

  /**
   * Vérifie si un mois du calendrier a été payé en croisant avec
   * la liste des paiements réussis du contrat.
   */
  isMoisPaye(dateStr: string): boolean {
    if (!this.contratSelectionne?.paiements?.length) return false;
    const cible = dateStr.slice(0, 7); // 'YYYY-MM'
    return this.contratSelectionne.paiements.some(p =>
      p.statutPaiement === StatutPaiement.VALIDE &&
      p.datePaiement?.slice(0, 7) === cible
    );
  }

  /**
   * Retourne la prochaine échéance non payée dans le calendrier.
   */
  getProchainPaiement(): string | null {
    if (!this.contratSelectionne?.calendrier?.length) return null;
    return this.contratSelectionne.calendrier.find(d =>
      d >= this.today && !this.isMoisPaye(d)
    ) || null;
  }

  estPaye(statut: StatutPaiement): boolean {
    return statut === StatutPaiement.VALIDE;
  }

  /**
   * Compte le nombre de mois effectivement payés.
   */
  getNbMoisPayes(): number {
    if (!this.contratSelectionne?.paiements) return 0;
    return this.contratSelectionne.paiements.filter(p => p.statutPaiement === StatutPaiement.VALIDE).length;
  }

  /**
   * Pourcentage de mois payés par rapport au calendrier total.
   */
  getPourcentagePaye(): number {
    const total = this.contratSelectionne?.calendrier?.length || 0;
    if (total === 0) return 0;
    return Math.round((this.getNbMoisPayes() / total) * 100);
  }

  /**
   * Télécharge la facture PDF d'un paiement.
   */
  telechargerFacture(paiement: Paiement): void {
    this.paiementService.downloadRecu(paiement.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture_paiement_${paiement.id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Erreur lors du téléchargement de la facture :', err);
      }
    });
  }

  /**
   * Ouvre le contrat signé (scan) dans un nouvel onglet.
   */
  voirContratSigne(): void {
    if (!this.contratSelectionne?.imageScanneUrl) return;
    const url = this.contratSelectionne.imageScanneUrl.startsWith('http')
      ? this.contratSelectionne.imageScanneUrl
      : `${environment.apiUrl}/${this.contratSelectionne.imageScanneUrl}`;
    window.open(url, '_blank');
  }

  // ── Formatage ───────────────────────────────────────────────────
  formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatMontant(montant: number | undefined): string {
    return (montant ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'TND', minimumFractionDigits: 2 });
  }

  getInitiales(nom: string): string {
    return nom?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'XX';
  }

  trackById(_: number, item: Contrat): number { return item.id; }
}
