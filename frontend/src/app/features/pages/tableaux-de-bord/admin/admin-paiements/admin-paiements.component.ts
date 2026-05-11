import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaiementService } from '../../../../../core/services/paiement.service';
import { Paiement } from '../../../../../core/models/paiement.model';
import { StatutPaiement } from '../../../../../core/models/enums.model';

interface ClientGroup {
  clientFullName: string;
  clientId: number;
  paiements: Paiement[];
  totalPaye: number;
  expanded: boolean;
}

@Component({
  selector: 'app-admin-paiements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-paiements.component.html',
  styleUrl: './admin-paiements.component.scss'
})
export class AdminPaiementsComponent implements OnInit {

  private paiementService = inject(PaiementService);
  private router = inject(Router);

  // ── State ──────────────────────────────────────
  paiements: Paiement[] = [];
  paiementsFiltres: Paiement[] = [];
  clientGroups: ClientGroup[] = [];
  chargement = true;
  erreur: string | null = null;

  // ── Filters ────────────────────────────────────
  recherche = '';
  filtreStatut = '';
  filtreMois = '';

  // ── Platform stats ─────────────────────────────
  totalRevenuePlateforme = 0;
  totalEnAttente = 0;
  totalEchoue = 0;
  countValide = 0;
  countInitie = 0;
  countEchoue = 0;

  // ── Options ────────────────────────────────────
  readonly statutOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: StatutPaiement.VALIDE, label: '✅ Payé (VALIDE)' },
    { value: StatutPaiement.INITIE, label: '⏳ Initié' },
    { value: StatutPaiement.ECHOUE, label: '❌ Échoué' }
  ];

  ngOnInit(): void {
    this.chargerPaiements();
  }

  chargerPaiements(): void {
    this.chargement = true;
    this.erreur = null;
    this.paiementService.getAllPaiements().subscribe({
      next: (data) => {
        this.paiements = data ?? [];
        this.calculerStats();
        this.appliquerFiltres();
        this.chargement = false;
      },
      error: (err) => {
        console.error('Erreur chargement paiements :', err);
        this.erreur = 'Impossible de charger les paiements de la plateforme.';
        this.chargement = false;
      }
    });
  }

  calculerStats(): void {
    const valide  = this.paiements.filter(p => p.statutPaiement === StatutPaiement.VALIDE);
    const initie  = this.paiements.filter(p => p.statutPaiement === StatutPaiement.INITIE);
    const echoue  = this.paiements.filter(p => p.statutPaiement === StatutPaiement.ECHOUE);

    this.totalRevenuePlateforme = valide.reduce((s, p) => s + p.montantTotal, 0);
    this.totalEnAttente = initie.reduce((s, p) => s + p.montantTotal, 0);
    this.totalEchoue    = echoue.reduce((s, p) => s + p.montantTotal, 0);

    this.countValide = valide.length;
    this.countInitie = initie.length;
    this.countEchoue = echoue.length;
  }

  appliquerFiltres(): void {
    const t = this.recherche.toLowerCase().trim();
    this.paiementsFiltres = this.paiements.filter(p => {
      const texte   = t === '' ||
        p.clientFullName?.toLowerCase().includes(t) ||
        p.annonceTitre?.toLowerCase().includes(t) ||
        String(p.id).includes(t);
      const statut  = this.filtreStatut === '' || p.statutPaiement === this.filtreStatut as StatutPaiement;
      const mois    = this.filtreMois === '' || p.datePaiement?.startsWith(this.filtreMois);
      return texte && statut && mois;
    });

    this.grouperParClient();
  }

  /**
   * Groupe les paiements filtrés par client (clientId + clientFullName).
   */
  grouperParClient(): void {
    const map = new Map<number, ClientGroup>();

    for (const p of this.paiementsFiltres) {
      const key = p.clientId ?? 0;
      if (!map.has(key)) {
        map.set(key, {
          clientFullName: p.clientFullName || 'Client inconnu',
          clientId: key,
          paiements: [],
          totalPaye: 0,
          expanded: true // ouvrir par défaut
        });
      }
      const group = map.get(key)!;
      group.paiements.push(p);
      if (p.statutPaiement === StatutPaiement.VALIDE) {
        group.totalPaye += p.montantTotal;
      }
    }

    // Trier par nom de client
    this.clientGroups = Array.from(map.values())
      .sort((a, b) => a.clientFullName.localeCompare(b.clientFullName));
  }

  toggleGroup(group: ClientGroup): void {
    group.expanded = !group.expanded;
  }

  telechargerRecu(id: number): void {
    this.paiementService.downloadRecu(id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture_paiement_${id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => console.error('Impossible de récupérer la facture.')
    });
  }

  reinitialiserFiltres(): void {
    this.recherche = '';
    this.filtreStatut = '';
    this.filtreMois = '';
    this.appliquerFiltres();
  }

  retourAdmin(): void {
    this.router.navigate(['/tableau-de-bord/admin']);
  }

  // ── Helpers ────────────────────────────────────
  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatMontant(m: number): string {
    return (m ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'TND', minimumFractionDigits: 2 });
  }

  estValide(s: StatutPaiement): boolean { return s === StatutPaiement.VALIDE; }

  getStatutLabel(s: StatutPaiement): string {
    switch(s) {
      case StatutPaiement.VALIDE:  return 'Payé';
      case StatutPaiement.ECHOUE:  return 'Échoué';
      case StatutPaiement.INITIE:  return 'Initié';
      default: return s;
    }
  }

  getStatutClass(s: StatutPaiement): string {
    switch(s) {
      case StatutPaiement.VALIDE:  return 'ap-badge ap-badge--success';
      case StatutPaiement.ECHOUE:  return 'ap-badge ap-badge--danger';
      default: return 'ap-badge ap-badge--warning';
    }
  }

  getInitiales(nom: string): string {
    if (!nom) return 'XX';
    return nom.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }

  trackById(_: number, p: Paiement): number { return p.id; }
  trackByClientId(_: number, g: ClientGroup): number { return g.clientId; }
}
