import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChambreDTO } from '../../../core/models/chambre';
import { BadgeComponent } from '../badge/badge.component';
import { PrixFormatPipe } from '../../pipes/prix-format.pipe';

@Component({
  selector: 'app-chambre-card',
  standalone: true,
  imports: [CommonModule, BadgeComponent, PrixFormatPipe],
  template: `
    <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <!-- Image -->
      <div class="relative h-40 bg-slate-200">
        <img
          [src]="photoUrl"
          [alt]="chambre.titre"
          class="w-full h-full object-cover"
        />
        <div class="absolute top-3 right-3">
          <app-badge
            type="etat-chambre"
            [value]="chambre.etatChambre"
            [label]="statusLabel"
          ></app-badge>
        </div>
      </div>

      <!-- Content -->
      <div class="p-4">
        <h4 class="font-bold text-slate-800 mb-2">{{ chambre.titre }}</h4>
        <p class="text-sm text-slate-600 mb-3 line-clamp-2">{{ chambre.description }}</p>

        <div class="flex justify-between items-center mb-3 pb-3 border-b border-slate-200">
          <span class="text-sm text-slate-600">{{ chambre.surface }} m²</span>
          <span class="text-sm text-slate-600">Chambre n°{{ chambre.numero }}</span>
        </div>

        <p class="text-lg font-bold text-indigo-600">{{ chambre.prixMensuel | prixFormat }}</p>
      </div>
    </div>
  `
})
export class ChambreCardComponent {
  @Input() chambre!: ChambreDTO;

  get photoUrl(): string {
    return this.chambre.photos && this.chambre.photos.length > 0
      ? this.chambre.photos[0].url
      : 'https://via.placeholder.com/300x200?text=Pas+de+photo';
  }

  get statusLabel(): string {
    const map: Record<string, string> = {
      DISPONIBLE: 'Disponible',
      RESERVEE: 'Réservée',
      LOUEE: 'Louée',
      HORS_SERVICE: 'Hors service'
    };
    return map[this.chambre.etatChambre] || this.chambre.etatChambre;
  }
}
