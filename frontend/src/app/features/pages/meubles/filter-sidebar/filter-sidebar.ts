import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface MeubleFilters {
  categorie: string;
  etat: string;
  minPrix: number;
  maxPrix: number;
}

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.compnent.css']
})
export class FilterSidebarComponent {
  @Output() filtersChange = new EventEmitter<MeubleFilters>();

  selectedCategorie = '';
  selectedEtat = '';
  minPrix = 0;
  maxPrix = 2500;

  categories = [
    { label: 'Tout', value: '' },
    { label: 'Lit', value: 'LIT' },
    { label: 'Bureau', value: 'BUREAU' },
    { label: 'Chaise', value: 'CHAISE' },
    { label: 'Armoire', value: 'ARMOIRE' },
    { label: 'Canapé', value: 'CANAPE' },
    { label: 'Table', value: 'TABLE' },
    { label: 'Étagère', value: 'ETAGERE' },
    { label: 'Autre', value: 'AUTRE' }
  ];

  etats = [
    { label: 'Tous', value: '' },
    { label: 'Neuf', value: 'NEUF' },
    { label: 'Bon état', value: 'BON_ETAT' },
    { label: 'Usagé', value: 'USAGE' }
  ];

  applyFilters(): void {
    this.filtersChange.emit({
      categorie: this.selectedCategorie,
      etat: this.selectedEtat,
      minPrix: this.minPrix,
      maxPrix: this.maxPrix
    });
  }

  resetFilters(): void {
    this.selectedCategorie = '';
    this.selectedEtat = '';
    this.minPrix = 0;
    this.maxPrix = 2500;
    this.applyFilters();
  }
}
