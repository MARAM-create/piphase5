import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AnnonceLocationDTO } from '../../../../../core/models/annonce';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { PrixFormatPipe } from '../../../../../shared/pipes/prix-format.pipe';
import { TypeLogementPipe } from '../../../../../shared/pipes/type-logement.pipe';
import { AuthService } from '../../../../../core/services/auth.service';
import { AnnonceService } from '../../../../../core/services/annonce.service';

@Component({
  selector: 'app-annonce-card',
  standalone: true,
  imports: [CommonModule, RouterModule, BadgeComponent, PrixFormatPipe, TypeLogementPipe],
  template: `
    <div
        (click)="onCardClick()"
      class="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden"
      [attr.data-annonce-id]="annonce.idAnnonce"
    >
      <!-- Image -->
      <div class="relative h-48 bg-slate-200 overflow-hidden">
        <img
          [src]="photoUrl"
          [alt]="annonce.titre"
          class="w-full h-full object-cover"
        />

        <!-- Type badge — left -->
        <div class="absolute top-3 left-3">
          <app-badge
            type="type-logement"
            [value]="annonce.typeLogement"
            [label]="annonce.typeLogement | typeLogement"
          ></app-badge>
        </div>

        <!-- Right side: status badge OR action buttons depending on role -->
        <div class="absolute top-3 right-3">

          <!-- ADMIN or listing owner → show action buttons -->
          <div
            *ngIf="canManage; else statusBadge"
            class="flex gap-2"
            (click)="$event.stopPropagation()"
          >

            <!-- Publish button — ADMIN only, visible only when BROUILLON -->
            <button
              *ngIf="isAdmin && annonce.etatAnnonce === 'BROUILLON'"
              (click)="onPublish()"
              title="Publier l'annonce"
              class="flex items-center justify-center w-8 h-8 rounded-full
                     bg-white/90 backdrop-blur-sm shadow-md
                     text-emerald-500 hover:bg-emerald-500 hover:text-white
                     transition-all duration-200 hover:scale-110"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>

            <!-- Edit button -->
            <button
              (click)="onUpdate()"
              title="Modifier l'annonce"
              class="flex items-center justify-center w-8 h-8 rounded-full
                     bg-white/90 backdrop-blur-sm shadow-md
                     text-[#37524B] hover:bg-[#37524B] hover:text-white
                     transition-all duration-200 hover:scale-110"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>

            <!-- Delete button -->
            <button
              (click)="onDelete()"
              title="Supprimer l'annonce"
              class="flex items-center justify-center w-8 h-8 rounded-full
                     bg-white/90 backdrop-blur-sm shadow-md
                     text-red-500 hover:bg-red-500 hover:text-white
                     transition-all duration-200 hover:scale-110"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/>
                <path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>

          <!-- Everyone else → show status badge -->
          <ng-template #statusBadge>
            <app-badge
              type="etat-annonce"
              [value]="annonce.etatAnnonce"
              [label]="statusLabel"
            ></app-badge>
          </ng-template>

        </div>
      </div>

      <!-- Content -->
      <div class="p-4">
        <h3 class="font-bold text-lg text-slate-800 mb-2 line-clamp-2">
          {{ annonce.titre }}
        </h3>

        <!-- Localisation -->
        <p class="text-sm text-slate-600 mb-3">
          <span class="font-semibold">{{ annonce.adresse.ville }}</span>
          {{ annonce.adresse.codePostal }}
        </p>

        <!-- Caractéristiques -->
        <div class="flex gap-4 text-sm text-slate-600 mb-4 pb-4 border-b border-slate-200">
          <span>{{ annonce.surface }} m²</span>
          <span>{{ annonce.nombrePieces }} pièces</span>
          <span>Étage {{ annonce.etage }}</span>
        </div>

        <!-- Prix -->
        <div class="mb-3">
          <p class="text-2xl font-bold" style="color: #37524B;">
            {{ annonce.prixMensuel | prixFormat }}
          </p>
          <p *ngIf="annonce.chargesMensuelles > 0" class="text-xs text-slate-500">
            + {{ annonce.chargesMensuelles | prixFormat:' €' }} de charges
          </p>
        </div>

        <!-- Disponibilité -->
        <p class="text-xs text-slate-600">
          Disponible à partir du {{ annonce.dateDisponibiliteDebut | date:'shortDate' }}
        </p>
      </div>
    </div>
  `
})
export class AnnonceCardComponent {
  @Input() annonce!: AnnonceLocationDTO;
  @Output() cardClicked   = new EventEmitter<number>();
  @Output() updateClicked = new EventEmitter<number>();
  @Output() deleteClicked = new EventEmitter<number>();

  private authService   = inject(AuthService);
  private router        = inject(Router);
  private annonceService = inject(AnnonceService);

  onCardClick(): void {
    this.router.navigate(['/annonces', this.annonce.idAnnonce]);
  }

  get isAdmin(): boolean {
    return this.authService.getSnapshot()?.role === 'ADMIN';
  }

  get canManage(): boolean {
    const user = this.authService.getSnapshot();
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'PROPRIETAIRE') {
      return this.annonce.proprietaireId === user.id;
    }
    return false;
  }

  get photoUrl(): string {
    return this.annonce.photos?.length
      ? this.annonce.photos[0].url
      : 'https://via.placeholder.com/400x300?text=Pas+de+photo';
  }

  get statusLabel(): string {
    const map: Record<string, string> = {
      PUBLIEE:      'Publié',
      INDISPONIBLE: 'Indisponible',
      BROUILLON:    'Brouillon',
      ARCHIVEE:     'Archivée',
      SUSPENDUE:    'Suspendue'
    };
    return map[this.annonce.etatAnnonce] || this.annonce.etatAnnonce;
  }

  onUpdate(): void {
    console.log('🟢 navigating to modifier:', this.annonce.idAnnonce);
    this.router.navigate(['/annonces', this.annonce.idAnnonce, 'modifier']);
  }

  onDelete(): void {
    console.log('🔴 deleting:', this.annonce.idAnnonce);
    if (!confirm('Confirmer la suppression ?')) return;
    this.annonceService.delete(this.annonce.idAnnonce).subscribe({
      next: () => window.location.reload(),
      error: (err) => console.error('Erreur suppression:', err)
    });
  }

  onPublish(): void {
    console.log('✅ publishing:', this.annonce.idAnnonce);
    if (!confirm('Confirmer la publication de cette annonce ?')) return;
    this.annonceService.publish(this.annonce.idAnnonce).subscribe({
      next: () => {
        // Optimistically update the local state to avoid a full reload
        this.annonce = { ...this.annonce, etatAnnonce: 'PUBLIEE' };
      },
      error: (err) => console.error('Erreur publication:', err)
    });
  }
}
