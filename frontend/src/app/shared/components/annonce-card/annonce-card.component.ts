import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnnonceLocationDTO } from '../../../core/models/annonce';
import { BadgeComponent } from '../badge/badge.component';
import { PrixFormatPipe } from '../../pipes/prix-format.pipe';
import { TypeLogementPipe } from '../../pipes/type-logement.pipe';

@Component({
  selector: 'app-annonce-card',
  standalone: true,
  imports: [CommonModule, RouterModule, BadgeComponent, PrixFormatPipe, TypeLogementPipe],
  template: `
    <div
      [routerLink]="['/annonces', annonce.idAnnonce]"
      class="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden"
    >
      <!-- Image -->
      <div class="relative h-48 bg-slate-200 overflow-hidden">
        <img
          [src]="photoUrl"
          [alt]="annonce.titre"
          class="w-full h-full object-cover"
        />
        <div class="absolute top-3 left-3">
          <app-badge
            type="type-logement"
            [value]="annonce.typeLogement"
            [label]="annonce.typeLogement | typeLogement"
          ></app-badge>
        </div>
        <!-- <div class="absolute top-3 right-3">
          <app-badge
            type="etat-annonce"
            [value]="annonce.etatAnnonce"
            [label]="statusLabel"
          ></app-badge>
        </div> -->
      </div>

      <!-- Content -->
      <div class="p-4">
        <h3 class="font-bold text-lg text-slate-800 mb-2 line-clamp-2">{{ annonce.titre }}</h3>

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
          <p class="text-2xl font-bold text-indigo-600">{{ annonce.prixMensuel | prixFormat }}</p>
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
  @Output() cardClicked = new EventEmitter<number>();

  get photoUrl(): string {
    return this.annonce.photos && this.annonce.photos.length > 0
      ? this.annonce.photos[0].url
      : 'https://via.placeholder.com/400x300?text=Pas+de+photo';
  }

  // get statusLabel(): string {
  //   const map: Record<string, string> = {
  //     PUBLIEE: 'Publié',
  //     INDISPONIBLE: 'Indisponible',
  //     BROUILLON: 'Brouillon',
  //     ARCHIVEE: 'Archivée',
  //     SUSPENDUE: 'Suspendue'
  //   };
  //   return map[this.annonce.etatAnnonce] || this.annonce.etatAnnonce;
  // }
}
