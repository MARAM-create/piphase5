import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ContratService } from '../../core/services/contrat.service';

@Component({
  selector: 'app-mes-demandes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mes-demandes.component.html',
  styleUrls: ['./mes-demandes.component.scss']
})
export class MesDemandesComponent implements OnInit {
  private API = `${environment.apiUrl}/api`;
  utilisateurConnecte: any = null;

  typeActif: 'location' | 'meubles' | 'services' = 'location';
  filtreLecture: 'toutes' | 'archives' | 'brouillons' = 'toutes';

  demandes: any[] = [];
  demandesFiltrees: any[] = [];
  loading = false;

  creerContratEnCours: number | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private contratService: ContratService
  ) { }

  ngOnInit(): void {
    const raw = localStorage.getItem('utilisateur');
    if (raw) {
      this.utilisateurConnecte = JSON.parse(raw);
      this.chargerDemandesSelonFiltre();
    }
  }


  ouvrirAnnonce(demande: any): void {
    if (!demande?.annonceId) return;

    this.router.navigate(['/annonces', demande.annonceId]);
  }

  voirPdfDemande(demandeId: number): void {
    if (!demandeId) return;

    this.http.get(`${this.API}/demandes/${demandeId}/pdf`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `demande_locavia_${demandeId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Erreur téléchargement PDF', err);
        alert('Impossible de télécharger le PDF.');
      }
    });
  }


  changerType(type: 'location' | 'meubles' | 'services'): void {
    this.typeActif = type;

    if (type === 'location') {
      this.chargerDemandesSelonFiltre();
    } else {
      this.demandes = [];
      this.demandesFiltrees = [];
    }
  }

  changerFiltreLecture(filtre: 'toutes' | 'archives' | 'brouillons'): void {
    this.filtreLecture = filtre;
    this.chargerDemandesSelonFiltre();
  }

  chargerDemandesSelonFiltre(): void {
    if (this.typeActif !== 'location') {
      this.demandes = [];
      this.demandesFiltrees = [];
      return;
    }

    if (this.filtreLecture === 'archives') {
      this.chargerDemandesArchivees();
    } else {
      this.chargerDemandesActives();
    }
  }

  chargerDemandesActives(): void {
    if (!this.utilisateurConnecte?.id) return;

    this.loading = true;

    this.http.get<any[]>(`${this.API}/demandes/etudiant/${this.utilisateurConnecte.id}`).subscribe({
      next: (res) => {
        this.demandes = Array.isArray(res) ? res : [];
        this.demandesFiltrees = [...this.demandes];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement demandes actives', err);
        this.demandes = [];
        this.demandesFiltrees = [];
        this.loading = false;
      }
    });
  }

  chargerDemandesArchivees(): void {
    if (!this.utilisateurConnecte?.id) return;

    this.loading = true;

    this.http.get<any[]>(`${this.API}/demandes/etudiant/${this.utilisateurConnecte.id}/archives`).subscribe({
      next: (res) => {
        this.demandes = Array.isArray(res) ? res : [];
        this.demandesFiltrees = [...this.demandes];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement demandes archivées', err);
        this.demandes = [];
        this.demandesFiltrees = [];
        this.loading = false;
      }
    });
  }

  archiverDemande(demandeId: number): void {
    if (!this.utilisateurConnecte?.id) return;

    this.http.put(
      `${this.API}/demandes/${demandeId}/archiver?etudiantId=${this.utilisateurConnecte.id}`,
      {}
    ).subscribe({
      next: () => {
        this.chargerDemandesSelonFiltre();
      },
      error: (err) => {
        console.error('Erreur archivage demande', err);
        alert(err?.error?.message || 'Impossible d’archiver la demande.');
      }
    });
  }



  desarchiverDemande(demandeId: number): void {
    if (!this.utilisateurConnecte?.id) return;

    this.http.put(
      `${this.API}/demandes/${demandeId}/desarchiver?etudiantId=${this.utilisateurConnecte.id}`,
      {}
    ).subscribe({
      next: () => {
        this.filtreLecture = 'toutes';
        this.chargerDemandesSelonFiltre();
      },
      error: (err) => {
        console.error('Erreur désarchivage demande', err);
        alert(err?.error?.message || 'Impossible de désarchiver la demande.');
      }
    });
  }

  supprimerDemande(demandeId: number): void {
    if (!this.utilisateurConnecte?.id) return;

    const confirmer = confirm('Voulez-vous vraiment supprimer cette demande ?');
    if (!confirmer) return;

    this.http.delete(
      `${this.API}/demandes/${demandeId}?etudiantId=${this.utilisateurConnecte.id}`
    ).subscribe({
      next: () => this.chargerDemandesSelonFiltre(),
      error: (err) => {
        console.error('Erreur suppression demande', err);
        alert(err?.error?.message || 'Impossible de supprimer la demande.');
      }
    });
  }

  contacterProprietaire(demande: any): void {
    if (demande?.statutDemande !== 'ACCEPTEE' || !demande?.conversationId) {
      return;
    }

    this.router.navigate(
      ['/tableau-de-bord/etudiant'],
      { queryParams: { onglet: 'messagerie', conversationId: demande.conversationId } }
    );
  }

  creerContratDepuisDemande(demandeId: number): void {
    if (this.creerContratEnCours) return;

    this.creerContratEnCours = demandeId;
    this.contratService.creerContrat(demandeId).subscribe({
      next: (contrat) => {
        this.creerContratEnCours = null;
        this.router.navigate(['/contrats']);
      },
      error: (err) => {
        this.creerContratEnCours = null;
        console.error('Erreur création contrat:', err);
        const msg = err?.error?.message || err?.error || 'Impossible de créer le contrat. Vérifiez que la demande existe.';
        alert(msg);
      }
    });
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'ACCEPTEE': return 'Acceptée';
      case 'REFUSEE': return 'Refusée';
      case 'EN_ATTENTE': return 'En attente';
      default: return statut || 'Inconnu';
    }
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'ACCEPTEE': return 'statut-acceptee';
      case 'REFUSEE': return 'statut-refusee';
      case 'EN_ATTENTE': return 'statut-attente';
      default: return 'statut-default';
    }
  }
}
