import { Component, Output, EventEmitter, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-md">
      <h3 class="font-bold text-lg mb-6 text-slate-800">Filtres</h3>

      <!-- Type Logement -->
      <div class="mb-6">
        <label class="block text-sm font-semibold text-slate-700 mb-2">Type de logement</label>
        <select
          [(ngModel)]="typeLogement"
          (change)="onFilterChange()"
          class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tous</option>
          <option value="STUDIO">Studio</option>
          <option value="APPARTEMENT">Appartement</option>
          <option value="MAISON">Maison</option>
          <option value="COLOCATION">Colocation</option>
          <option value="CHAMBRE_SEULE">Chambre seule</option>
        </select>
      </div>

      <!-- Mode Location -->
      <div class="mb-6">
        <label class="block text-sm font-semibold text-slate-700 mb-2">Mode de location</label>
        <select
          [(ngModel)]="modeLocation"
          (change)="onFilterChange()"
          class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tous</option>
          <option value="ENTIER">Logement entier</option>
          <option value="PAR_CHAMBRE">Par chambre</option>
        </select>
      </div>

      <!-- Prix max -->
      <div class="mb-6">
        <label class="block text-sm font-semibold text-slate-700 mb-2">
          Prix mensuel max : {{ prixMax }} €
        </label>
        <input
          type="range"
          [(ngModel)]="prixMax"
          (change)="onFilterChange()"
          min="0"
          max="3000"
          step="100"
          class="w-full accent-indigo-600"
        />
        <div class="flex justify-between text-xs text-slate-500 mt-1">
          <span>0 €</span>
          <span>3000 €</span>
        </div>
      </div>

      <!-- Meublage -->
      <div class="mb-6">
        <label class="block text-sm font-semibold text-slate-700 mb-2">Meublage</label>
        <select
          [(ngModel)]="meublage"
          (change)="onFilterChange()"
          class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tous</option>
          <option value="MEUBLE">Meublé</option>
          <option value="NON_MEUBLE">Non meublé</option>
          <option value="SEMI_MEUBLE">Semi-meublé</option>
        </select>
      </div>

      <!-- Surface min -->
      <div class="mb-6">
        <label class="block text-sm font-semibold text-slate-700 mb-2">Surface min (m²)</label>
        <input
          type="number"
          [(ngModel)]="surface"
          (change)="onFilterChange()"
          min="0"
          max="500"
          class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <!-- Reset Button -->
      <button
        (click)="resetFilters()"
        class="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-lg font-semibold transition-colors"
      >
        Réinitialiser les filtres
      </button>
    </div>
  `
})
export class FilterSidebarComponent {
  @Input() set initialTypeLogement(val: string) {
    this.typeLogement = val;
  }
  @Input() set initialModeLocation(val: string) {
    this.modeLocation = val;
  }
  @Input() set initialPrixMax(val: number) {
    this.prixMax = val;
  }
  @Input() set initialMeublage(val: string) {
    this.meublage = val;
  }
  @Input() set initialSurface(val: number) {
    this.surface = val;
  }

  @Output() filterChange = new EventEmitter<{
    typeLogement: string;
    modeLocation: string;
    prixMax: number;
    meublage: string;
    surface: number;
  }>();

  typeLogement = '';
  modeLocation = '';
  prixMax = 3000;
  meublage = '';
  surface = 0;

  onFilterChange(): void {
    this.filterChange.emit({
      typeLogement: this.typeLogement,
      modeLocation: this.modeLocation,
      prixMax: this.prixMax,
      meublage: this.meublage,
      surface: this.surface
    });
  }

  resetFilters(): void {
    this.typeLogement = '';
    this.modeLocation = '';
    this.prixMax = 3000;
    this.meublage = '';
    this.surface = 0;
    this.onFilterChange();
  }
}
