import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContratService } from '../../../core/services/contrat.service';
import { ToastService } from '../../../core/services/toast.service';
import { Contrat } from '../../../core/models/contrat.model';
import { Paiement } from '../../../core/models/paiement.model';
import { StatutContrat } from '../../../core/models/enums.model';
import { switchMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

@Component({
  selector: 'app-liste-contrats',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './liste-contrats.component.html',
  styleUrl: './liste-contrats.component.scss'
})
export class ListeContratsComponent implements OnInit, OnDestroy {

  private readonly contratService = inject(ContratService);
  private readonly toastService   = inject(ToastService);
  private readonly route          = inject(ActivatedRoute);
  private readonly backendUrl     = 'http://192.168.1.175:30808';

  searchTerm: string = '';
  searchDate: string = '';
  searchSubject = new Subject<void>();
  searchSubscription!: Subscription;
  filteredContrats: Contrat[] = [];

  /** true while the IA scan is running — shows a spinner on the upload button */
  scanningContratId: number | null = null;

  // Calendrier properties
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin],
    locale: 'fr',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek'
    },
    buttonText: {
      today: "Aujourd'hui",
      month: 'Mois',
      week: 'Semaine'
    },
    events: [],
    eventColor: '#4f46e5',
    displayEventTime: false,
    contentHeight: 'auto'
  };
  isCalendrierModalOpen: boolean = false;
  calendrierContratTitre: string = '';

  // Historique properties
  expandedHistoryId: number | null = null;
  historiquePaiements: Paiement[] = [];
  historiqueLoading: boolean = false;

  private refreshTimer: any;

  contrats = signal<Contrat[]>([]);
  loading  = signal<boolean>(true);
  error    = signal<string | null>(null);
  filtreActif = signal<'TOUS' | 'SIGNES' | 'ACTIFS'>('TOUS');

  contratsFiltres = computed(() => {
    const filtre = this.filtreActif();
    const tous   = this.contrats();

    if (filtre === 'SIGNES') {
      return tous.filter(contrat =>
        !!contrat.imageScanneUrl &&
        contrat.statutIa === 'VALIDE'
      );
    }

    if (filtre === 'ACTIFS') {
      return tous.filter(contrat => contrat.statutContrat === StatutContrat.ACTIF);
    }

    return tous;
  });

  activeCount = computed(() =>
    this.contrats().filter(c => c.statutContrat === StatutContrat.ACTIF).length
  );

  pendingCount = computed(() =>
    this.contrats().filter(c =>
      c.statutContrat === StatutContrat.EN_ATTENTE ||
      c.statutContrat === StatutContrat.EN_ATTENTE_PAIEMENT ||
      c.statutContrat === StatutContrat.EN_COURS_ANALYSE
    ).length
  );

  alertesPaiement = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 5);

    return this.contrats().filter(c => {
      if (c.statutContrat !== StatutContrat.ACTIF || !c.prochainPaiement) return false;
      const pDate = new Date(c.prochainPaiement);
      pDate.setHours(0, 0, 0, 0);
      return pDate >= today && pDate <= maxDate;
    });
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe((params: any) => {
      if (params['payment'] === 'success') {
        this.toastService.success('Paiement validé avec succès ! 🎉');
      }
    });

    this.chargerContrats('ALL');

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300)
    ).subscribe(() => {
      const filtre = this.filtreActif() === 'TOUS' ? 'ALL' : this.filtreActif();
      this.chargerContrats(filtre, this.searchTerm, this.searchDate);
    });

    this.planifierRafraichissementIA();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  onSearch(): void {
    this.searchSubject.next();
  }

  private chargerContrats(type: string, searchTerm?: string, searchDate?: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.contratService.getContratsFiltres(type, searchTerm, searchDate).subscribe({
      next: (data) => {
        console.log('✅ Structure des contrats reçue :', data);
        this.error.set(null);
        this.contrats.set(data || []);
        this.filtrerContratsLocal(); // Just assign all to filtered since backend handles it
        this.loading.set(false);
      },
      error: (err) => {
        console.error('❌ Erreur chargement contrats filtrés :', err);
        this.error.set('Impossible de charger les contrats. Vérifiez que le backend est démarré.');
        this.loading.set(false);
      }
    });
  }

  filtrerContratsLocal(): void {
    this.filteredContrats = [...this.contratsFiltres()];
  }

  setFiltre(nouveauFiltre: 'TOUS' | 'SIGNES' | 'ACTIFS'): void {
    this.filtreActif.set(nouveauFiltre);
    this.chargerContrats(nouveauFiltre === 'TOUS' ? 'ALL' : nouveauFiltre, this.searchTerm, this.searchDate);
  }

  planifierRafraichissementIA(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);

    this.refreshTimer = setInterval(() => {
      const besoinRefresh = this.contrats().some(c =>
        c.statutContrat === StatutContrat.EN_COURS_ANALYSE ||
        c.statutContrat === StatutContrat.EN_ATTENTE ||
        c.statutContrat === StatutContrat.BROUILLON ||
        c.statutContrat === StatutContrat.EN_ATTENTE_PAIEMENT
      );

      if (besoinRefresh) {
        console.log('🔄 Auto-refresh: statut en attente détecté, rechargement...');
        const filtre = this.filtreActif() === 'TOUS' ? 'ALL' : this.filtreActif();
        this.chargerContrats(filtre, this.searchTerm, this.searchDate);
      }
    }, 5000);
  }

  getStatutIcon(statut: StatutContrat): string {
    const icons: Record<string, string> = {
      BROUILLON: 'edit_note',
      EN_ATTENTE: 'hourglass_top',
      EN_COURS_ANALYSE: 'psychology',
      VALIDE: 'verified',
      EN_ATTENTE_PAIEMENT: 'payments',
      ACTIF: 'check_circle',
      ANNULE: 'cancel'
    };
    return icons[statut] ?? 'help';
  }

  getBadgeClasses(contrat: Contrat): string {
    const base = 'px-2.5 py-0.5 text-[10px] font-bold rounded-full';

    if (contrat.statutContrat === StatutContrat.EN_ATTENTE_PAIEMENT && contrat.statutIa !== 'VALIDE') {
      return `${base} bg-gray-100 text-gray-800`;
    }
    if (contrat.statutContrat === StatutContrat.EN_ATTENTE_PAIEMENT && contrat.statutIa === 'VALIDE') {
      return `${base} bg-amber-100 text-amber-700`;
    }

    switch (contrat.statutContrat) {
      case StatutContrat.ACTIF:            return `${base} bg-green-100 text-green-700`;
      case StatutContrat.EN_ATTENTE:       return `${base} bg-amber-100 text-amber-700`;
      case StatutContrat.BROUILLON:        return `${base} bg-secondary-container text-on-secondary-container`;
      case StatutContrat.EN_COURS_ANALYSE: return `${base} bg-blue-100 text-blue-700`;
      case StatutContrat.VALIDE:           return `${base} bg-teal-100 text-teal-700`;
      case StatutContrat.ANNULE:           return `${base} bg-error-container text-on-error-container`;
      default:                             return `${base} bg-surface-container text-on-surface-variant`;
    }
  }

  getStatutLabel(contrat: Contrat): string {
    if (contrat.statutContrat === StatutContrat.EN_ATTENTE_PAIEMENT && contrat.statutIa !== 'VALIDE') {
      return 'En attente de signature';
    }
    if (contrat.statutContrat === StatutContrat.EN_ATTENTE_PAIEMENT && contrat.statutIa === 'VALIDE') {
      return 'En attente de paiement';
    }

    const labels: Record<string, string> = {
      BROUILLON:          'Brouillon',
      EN_ATTENTE:         'En attente',
      EN_COURS_ANALYSE:   'En analyse',
      VALIDE:             'Validé',
      EN_ATTENTE_PAIEMENT:'Attente paiement',
      ACTIF:              'Actif',
      ANNULE:             'Annulé'
    };
    return labels[contrat.statutContrat] ?? contrat.statutContrat;
  }

  ouvrirPdf(pdfUrl: string | null | undefined): void {
    if (!pdfUrl) {
      this.toastService.warning("Le PDF n'est pas encore disponible pour ce contrat.");
      return;
    }
    const path    = pdfUrl.startsWith('/') ? pdfUrl : `/${pdfUrl}`;
    const fullUrl = `${this.backendUrl}${path}`;
    window.open(fullUrl, '_blank');
  }

  downloadPdf(contratId: number): void {
    this.contratService.genererPdf(contratId).pipe(
      switchMap(() => this.contratService.telechargerPdf(contratId))
    ).subscribe({
      next: (response: Blob) => {
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        this.toastService.success('Contrat prêt pour consultation.');
      },
      error: (err) => {
        console.error('❌ Erreur lors du téléchargement du PDF :', err);
        this.toastService.error('Impossible de générer ou télécharger le PDF.');
      }
    });
  }

  onFileSelected(event: Event, contratId: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      this.toastService.error(`Format non supporté : ${file.type}. Utilisez un PDF, JPG ou PNG.`);
      input.value = '';
      return;
    }

    this.scanningContratId = contratId;
    this.toastService.info('🔍 Analyse IA en cours... Veuillez patienter.', 30_000);

    this.contratService.uploadContratSigne(contratId, file).subscribe({
      next: () => {
        this.scanningContratId = null;
        this.toastService.success('✅ Contrat validé par l\'IA avec succès !');
        this.chargerContrats('ALL');
      },
      error: (err) => {
        this.scanningContratId = null;
        console.error('❌ Erreur lors de l\'envoi du fichier :', err);

        const status  = err?.status;
        const errBody = err?.error;

        if (status === 400 && errBody?.missingElements) {
          const missing = (errBody.missingElements as string[]).join(', ');
          this.toastService.error(`❌ Contrat rejeté par l'IA. Éléments manquants : ${missing}`);
        } else if (status === 503) {
          this.toastService.error('🌐 Service IA temporairement indisponible. Réessayez dans quelques instants.', 6000);
        } else {
          this.toastService.error('Erreur lors de l\'envoi du fichier. Vérifiez le format et réessayez.');
        }
      }
    });

    input.value = '';
  }
  
  telechargerFacture(contratId: number): void {
    this.contratService.getHistoriquePaiements(contratId).subscribe({
      next: (history) => {
         const facture = history.find((h: any) => h.statutPaiement === 'VALIDE' && h.fichierRecuPdfUrl);
         if (facture) {
            const url = `http://192.168.1.175:30808/${facture.fichierRecuPdfUrl}`;
            window.open(url, '_blank');
         } else {
            this.toastService.warning("Aucune facture trouvée pour ce contrat.");
         }
      },
      error: () => this.toastService.error("Impossible de récupérer la facture.")
    });
  }


  procederAuPaiement(contratId: number): void {
    this.contratService.initierPaiement(contratId).subscribe({
      next: (response: any) => {
        console.log('✅ STRIPE FULL RESPONSE:', response);
        const redirectUrl = response.checkoutUrl || response.url;
        if (redirectUrl) {
          console.log('🚀 Redirecting to:', redirectUrl);
          window.location.assign(redirectUrl);
        } else {
          console.error('❌ URL de paiement manquante dans la réponse :', response);
          this.toastService.error("L'URL de paiement est introuvable dans la réponse.");
        }
      },
      error: (err) => {
        console.error('❌ Erreur lors de l\'initiation du paiement :', err);
        const status = err?.status;
        if (status === 400) {
          this.toastService.error('Paiement bloqué : le contrat n\'est pas encore validé par l\'IA.', 6000);
        } else {
          this.toastService.error('Erreur lors de la création de la session de paiement. Veuillez réessayer.');
        }
      }
    });
  }

  supprimerContrat(id: number): void {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat ? Cette action est irréversible.')) {
      this.contratService.supprimerContrat(id).subscribe({
        next: () => {
          this.ngOnInit();
          this.toastService.success('Contrat supprimé avec succès.');
        },
        error: (err: any) => {
          console.error('❌ Erreur lors de la suppression :', err);
          this.toastService.error('Impossible de supprimer le contrat. Veuillez réessayer.');
        }
      });
    }
  }

  voirCalendrier(contrat: Contrat): void {
    this.contratService.getCalendrierPaiements(contrat.id).subscribe({
      next: (dates) => {
        const events = dates.map(date => ({
          title: 'Loyer exigible',
          date: date,
          allDay: true,
          color: '#4f46e5'
        }));
        this.calendarOptions = { ...this.calendarOptions, events };
        this.calendrierContratTitre = contrat.annonceTitre;
        this.isCalendrierModalOpen = true;
      },
      error: (err) => {
        console.error('❌ Erreur récupération calendrier :', err);
        this.toastService.error('Impossible de charger le calendrier de paiements.');
      }
    });
  }

  fermerCalendrier(): void {
    this.isCalendrierModalOpen = false;
  }

  toggleHistory(contratId: number): void {
    if (this.expandedHistoryId === contratId) {
      this.expandedHistoryId  = null;
      this.historiquePaiements = [];
    } else {
      this.historiqueLoading  = true;
      this.expandedHistoryId  = contratId;
      this.contratService.getHistoriquePaiements(contratId).subscribe({
        next: (history) => {
          this.historiquePaiements = history;
          this.historiqueLoading   = false;
        },
        error: (err) => {
          console.error('❌ Erreur de récupération historique :', err);
          this.historiqueLoading = false;
          this.toastService.error("Impossible de charger l'historique des paiements.");
        }
      });
    }
  }

  initierNouveauContrat(): void {
    const rawId = window.prompt("Veuillez saisir l'ID de la demande (DemandeLocation) pour générer le contrat :");
    if (rawId) {
      const demandeId = parseInt(rawId, 10);
      if (!isNaN(demandeId)) {
        this.loading.set(true);
        this.contratService.creerContrat(demandeId).subscribe({
          next: () => {
            this.toastService.success('Contrat généré avec succès !');
            this.chargerContrats('ALL');
          },
          error: (err) => {
            console.error('❌ Erreur création contrat :', err);
            this.toastService.error("Erreur lors de la génération. Vérifiez que la Demande, l'Annonce, le Bailleur et le Locataire existent.");
            this.loading.set(false);
          }
        });
      } else {
        this.toastService.warning('ID invalide. Veuillez saisir un nombre entier.');
      }
    }
  }
}
