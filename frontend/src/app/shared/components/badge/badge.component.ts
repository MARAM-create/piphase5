import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [ngClass]="getClasses()" class="inline-block px-3 py-1 rounded-full text-sm font-medium">
      {{ label }}
    </span>
  `
})
export class BadgeComponent {
  @Input() type: 'type-logement' | 'etat-annonce' | 'meublage' | 'etat-chambre' = 'type-logement';
  @Input() value: string = '';
  @Input() label: string = '';

  getClasses(): string {
    const baseClass = 'inline-block px-3 py-1 rounded-full text-sm font-medium';

    const colorMap: Record<string, string> = {
      // Type logement
      STUDIO: 'bg-blue-100 text-blue-700',
      APPARTEMENT: 'bg-indigo-100 text-indigo-700',
      MAISON: 'bg-green-100 text-green-700',
      COLOCATION: 'bg-purple-100 text-purple-700',
      CHAMBRE_SEULE: 'bg-orange-100 text-orange-700',
      // Etat annonce
      PUBLIEE: 'bg-emerald-100 text-emerald-700',
      INDISPONIBLE: 'bg-red-100 text-red-700',
      BROUILLON: 'bg-gray-100 text-gray-600',
      ARCHIVEE: 'bg-yellow-100 text-yellow-700',
      SUSPENDUE: 'bg-orange-100 text-orange-700',
      // Meublage
      MEUBLE: 'bg-cyan-100 text-cyan-700',
      NON_MEUBLE: 'bg-slate-100 text-slate-700',
      SEMI_MEUBLE: 'bg-amber-100 text-amber-700',
      // Etat chambre
      DISPONIBLE: 'bg-emerald-100 text-emerald-700',
      RESERVEE: 'bg-yellow-100 text-yellow-700',
      LOUEE: 'bg-red-100 text-red-700',
      HORS_SERVICE: 'bg-gray-100 text-gray-600'
    };

    return `${baseClass} ${colorMap[this.value] || 'bg-slate-100 text-slate-700'}`;
  }
}
