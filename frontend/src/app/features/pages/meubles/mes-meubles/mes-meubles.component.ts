import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MeubleService } from '../../../../core/services/meuble.service';
import { Meuble } from '../../../../core/models/meuble.model';

@Component({
  selector: 'app-mes-meubles',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './mes-meubles.component.html',
  styleUrls: ['./mes-meubles.component.css']
})
export class MesMeublesComponent implements OnInit {
  meubles: Meuble[] = [];
  chargement = true;
  erreur = '';

  recherche = '';
  filtreStatut: 'TOUS' | 'DISPONIBLE' | 'VENDU' | 'RESERVE' = 'TOUS';

  constructor(private meubleService: MeubleService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.meubleService.mesMeubles().subscribe({
      next: (data) => {
        this.meubles = data;
        this.chargement = false;
      },
      error: () => {
        this.erreur = 'Erreur de chargement';
        this.chargement = false;
      }
    });
  }

  get meublesFiltres(): Meuble[] {
    const terme = this.recherche.trim().toLowerCase();

    return this.meubles.filter((m) => {
      const matchRecherche =
        !terme ||
        m.titre?.toLowerCase().includes(terme) ||
        m.categorie?.toLowerCase().includes(terme) ||
        m.ville?.toLowerCase().includes(terme);

      const matchStatut =
        this.filtreStatut === 'TOUS' || m.statut === this.filtreStatut;

      return matchRecherche && matchStatut;
    });
  }

  getPhotoUrl(photo: string): string {
    return this.meubleService.getPhotoUrl(photo);
  }

  getPhotoPrincipale(meuble: Meuble): string | null {
    return meuble.photos && meuble.photos.length > 0
      ? this.getPhotoUrl(meuble.photos[0])
      : null;
  }

  getEtatLabel(etat: string): string {
    return etat === 'BON_ETAT' ? 'Bon état' : etat === 'NEUF' ? 'Neuf' : 'Usagé';
  }

  getStatutLabel(statut: string): string {
    return statut === 'DISPONIBLE' ? 'Disponible' : statut === 'VENDU' ? 'Vendu' : 'Réservé';
  }

  getStatutClass(statut: string): string {
    return statut === 'DISPONIBLE'
      ? 'disponible'
      : statut === 'VENDU'
        ? 'vendu'
        : 'reserve';
  }

  supprimer(id: number): void {
    if (!confirm('Confirmer la suppression ?')) return;

    this.meubleService.supprimerMeuble(id).subscribe({
      next: () => {
        this.meubles = this.meubles.filter((m) => m.id !== id);
      },
      error: (e) => alert(e.error?.message || 'Erreur')
    });
  }

  trackByMeubleId(_: number, meuble: Meuble): number {
    return meuble.id;
  }

  rendreDisponible(id: number): void {
    if (!confirm('Rendre ce meuble disponible à nouveau ?')) return;
    this.meubleService.rendreDisponible(id).subscribe({
      next: (m) => {
        const idx = this.meubles.findIndex(x => x.id === id);
        if (idx !== -1) this.meubles[idx] = m;
      },
      error: (e: any) => alert(e.error?.message || 'Erreur')
    });
  }
}
