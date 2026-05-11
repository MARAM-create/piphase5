import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaiementService } from '../../../core/services/paiement.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Paiement } from '../../../core/models/paiement.model';
import { StatutPaiement } from '../../../core/models/enums.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-liste-paiements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './liste-paiements.component.html',
  styleUrls: ['./liste-paiements.component.css']
})
export class ListePaiementsComponent implements OnInit, OnDestroy {

  constructor() {
    console.log("ListePaiementsComponent initialized");
  }

  private readonly paiementService = inject(PaiementService);
  private readonly authService     = inject(AuthService);
  private readonly toastService    = inject(ToastService);

  paiements = signal<Paiement[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  private sub = new Subscription();

  ngOnInit(): void {
    console.log("DEBUG: Payment component initialized");
    this.chargerPaiements();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private chargerPaiements(): void {
    console.log("DEBUG: Calling service /api/paiements/me");
    this.loading.set(true);
    
    this.paiementService.getMyPaiements().subscribe({
      next: (data) => {
        console.log("Data received:", data);
        this.paiements.set(data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error("DEBUG: API Error occurred:", err);
        this.error.set('Impossible de charger vos paiements.');
        this.loading.set(false);
      }
    });
  }

  totalDepense = computed(() => {
    return this.paiements()
      .filter(p => p.statutPaiement === StatutPaiement.VALIDE)
      .reduce((acc, curr) => acc + curr.montantTotal, 0);
  });

  getStatutClass(statut: StatutPaiement): string {
    switch (statut) {
      case StatutPaiement.VALIDE: return 'badge-locavia-success';
      case StatutPaiement.ECHOUE: return 'badge-locavia-danger';
      default: return 'badge-locavia-warning';
    }
  }

  getStatutLabel(statut: StatutPaiement): string {
    switch (statut) {
      case StatutPaiement.VALIDE: return 'Succès';
      case StatutPaiement.ECHOUE: return 'Échoué';
      default: return 'En attente';
    }
  }

  downloadInvoice(transactionId: number): void {
    this.paiementService.downloadRecu(transactionId).subscribe({
      next: (data) => {
        // Force le type Blob pour éviter les erreurs de rendu
        const blob = new Blob([data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(blob);
        
        // Ouvre dans un nouvel onglet pour prévisualisation inline
        window.open(fileURL, '_blank');
        
        this.toastService.success('Facture prête pour consultation.');
      },
      error: (err) => {
        console.error('Erreur lors du téléchargement du reçu:', err);
        this.toastService.error('Impossible de récupérer la facture.');
      }
    });
  }
}
