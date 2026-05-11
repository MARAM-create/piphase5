import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<section class="rounded-2xl border border-white/45 bg-[#071c13]/78 backdrop-blur-md shadow-2xl">    <div class="p-4 md:p-5">
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 items-end">
        <!-- Type logement -->
        <div>
          <label class="block text-xs font-bold text-white/90 mb-2">
            Type de logement
          </label>
          <select
            [ngModel]="typeLogement()"
            (ngModelChange)="typeLogement.set($event); onFilterChange()"
            class="w-full h-12 px-4 rounded-lg border border-white/20 bg-white text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#d9a755]"
          >
            <option value="">Tous</option>
            <option value="STUDIO">Studio</option>
            <option value="APPARTEMENT">Appartement</option>
            <option value="MAISON">Maison</option>
            <option value="COLOCATION">Colocation</option>
            <option value="CHAMBRE_SEULE">Chambre seule</option>
          </select>
        </div>

        <!-- Mode location -->
        <div>
          <label class="block text-xs font-bold text-white/90 mb-2">
            Mode de location
          </label>
          <select
            [ngModel]="modeLocation()"
            (ngModelChange)="modeLocation.set($event); onFilterChange()"
            class="w-full h-12 px-4 rounded-lg border border-white/20 bg-white text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#d9a755]"
          >
            <option value="">Tous</option>
            <option value="ENTIER">Logement entier</option>
            <option value="PAR_CHAMBRE">Par chambre</option>
          </select>
        </div>

        <!-- Prix max -->
        <div>
          <label class="block text-xs font-bold text-white/90 mb-2">
            Budget max : {{ prixMax() }} €
          </label>
          <div class="h-12 px-4 rounded-lg border border-white/20 bg-white flex items-center shadow-sm">
            <input
              type="range"
              [ngModel]="prixMax()"
              (ngModelChange)="prixMax.set(+$event); onFilterChange()"
              min="0"
              max="3000"
              step="100"
              class="w-full accent-[#0b3b28]"
            />
          </div>
        </div>

        <!-- Meublage -->
        <div>
          <label class="block text-xs font-bold text-white/90 mb-2">
            Meublage
          </label>
          <select
            [ngModel]="meublage()"
            (ngModelChange)="meublage.set($event); onFilterChange()"
            class="w-full h-12 px-4 rounded-lg border border-white/20 bg-white text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#d9a755]"
          >
            <option value="">Tous</option>
            <option value="MEUBLE">Meublé</option>
            <option value="NON_MEUBLE">Non meublé</option>
            <option value="SEMI_MEUBLE">Semi-meublé</option>
          </select>
        </div>

        <!-- Surface -->
        <div>
          <label class="block text-xs font-bold text-white/90 mb-2">
            Surface min
          </label>
          <input
            type="number"
            [ngModel]="surface()"
            (ngModelChange)="surface.set(+$event); onFilterChange()"
            min="0"
            max="500"
            placeholder="m²"
            class="w-full h-12 px-4 rounded-lg border border-white/20 bg-white text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#d9a755]"
          />
        </div>

        <!-- Reset -->
        <div>
          <button
            type="button"
            (click)="resetFilters()"
            class="w-full h-12 px-5 rounded-lg bg-[#e64b3f] hover:bg-[#d94136] text-white font-bold text-sm shadow-lg transition active:scale-[0.98]"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  </section>
`
})
export class FilterSidebarComponent {
@Output() filterChange = new EventEmitter<{
  typeLogement: string;
  modeLocation: string;
  prixMax: number;
  meublage: string;
  surface: number;
  ville: string;
}>();

  typeLogement = signal('');
  modeLocation = signal('');
  prixMax = signal(3000);
  meublage = signal('');
  surface = signal(0);
  ville = signal('');

onFilterChange(): void {
  this.filterChange.emit({
    typeLogement: this.typeLogement(),
    modeLocation: this.modeLocation(),
    prixMax: this.prixMax(),
    meublage: this.meublage(),
    surface: this.surface(),
    ville: this.ville()
  });
}

resetFilters(): void {
  this.typeLogement.set('');
  this.modeLocation.set('');
  this.prixMax.set(3000);
  this.meublage.set('');
  this.surface.set(0);
  this.ville.set('');
  this.onFilterChange();
}
}
