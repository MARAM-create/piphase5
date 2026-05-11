import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnnonceService } from '../../../../core/services/annonce.service';
import { AnnonceLocationDTO } from '../../../../core/models/annonce';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { AnnonceCardComponent } from '../components/annonce-card/annonce-card.component';
import { FilterSidebarComponent } from '../components/filter-sidebar/filter-sidebar.component';
import { MapViewComponent } from '../../../../shared/components/map-view/map-view.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listing',
  standalone: true,
  imports: [
    CommonModule,
    FooterComponent,
    AnnonceCardComponent,
    FilterSidebarComponent,
    MapViewComponent,
    SpinnerComponent
  ],
template: `
  <div class="min-h-screen bg-[#f4f1ea] text-slate-900">
    <!-- HERO + FILTERS -->
    <section class="relative overflow-hidden">
      <!-- Background image -->
      <div
        class="absolute inset-0 bg-cover bg-center scale-[1.02]"
        style="background-image: url('assets/images/listing-hero.png');"
      ></div>

      <!-- Cinematic overlay -->
      <div class="absolute inset-0 bg-[#061911]/45"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-[#061911]/20 via-[#061911]/40 to-[#061911]/80"></div>

      <!-- Hero content -->
      <div class="relative px-4 sm:px-6 lg:px-8 pt-10 pb-14">
        <div class="max-w-7xl mx-auto text-center">
          <p class="text-white text-3xl md:text-5xl font-serif font-semibold drop-shadow-md">
            Découvrez nos
          </p>

          <h1 class="mt-1 text-[#d9a755] text-4xl md:text-6xl font-serif italic font-bold drop-shadow-md">
            annonces de location
          </h1>

          <p class="mt-4 text-white/95 text-sm md:text-lg drop-shadow">
            Trouvez le logement idéal qui vous correspond
          </p>

          <div class="inline-flex items-center gap-2 mt-6 px-5 py-2 rounded-md border border-white/50 bg-[#0b2a1d]/55 backdrop-blur text-white text-xs font-bold tracking-[0.22em] uppercase shadow-lg">
            <span class="w-2 h-2 rounded-full bg-[#d9a755]"></span>
            Plus de 2 400 logements disponibles
          </div>
        </div>

        <!-- Filters -->
        <div class="max-w-7xl mx-auto mt-8">
          <app-filter-sidebar
            (filterChange)="onFilterChange($event)"
          ></app-filter-sidebar>
        </div>
      </div>
    </section>

<!-- MAIN CONTENT -->
<main class="relative z-10 px-3 sm:px-5 lg:px-6 pb-12 -mt-8 bg-[#061911]">
  <div class="max-w-[1500px] mx-auto">
    <div class="bg-[#f8f5ef] rounded-[26px] shadow-[0_22px_70px_rgba(0,0,0,0.32)] border border-white/80 p-4 md:p-6">

      <div *ngIf="isLoading()" class="flex justify-center py-12">
        <app-spinner></app-spinner>
      </div>

      <div
        *ngIf="!isLoading() && hasError()"
        class="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm"
      >
        <p class="text-red-700">
          Une erreur s'est produite lors du chargement des annonces.
        </p>
      </div>

      <div
        *ngIf="!isLoading() && !hasError()"
        class="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        <!-- Cards -->
        <div class="lg:col-span-4">
          <div
            *ngIf="filtered().length === 0"
            class="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-[0_10px_30px_rgba(15,23,42,0.08)] min-h-[160px] flex items-center justify-center"
          >
            <p class="text-slate-600 leading-relaxed">
              Aucune annonce ne correspond à vos critères.
            </p>
          </div>

<div
  *ngIf="filtered().length > 0"
  class="space-y-6 max-h-[760px] overflow-y-auto pr-2 custom-scroll"
>
<app-annonce-card
  *ngFor="let annonce of filtered()"
  [annonce]="annonce"
  (updateClicked)="onUpdateAnnonce($event)"
  (deleteClicked)="onDeleteAnnonce($event)"
></app-annonce-card>
          </div>
        </div>

        <!-- Map -->
        <div class="lg:col-span-8">
          <div class="sticky top-24 h-[760px] rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <app-map-view
              [annonces]="filtered()"
              (markerClick)="onMarkerClick($event)"
            ></app-map-view>
          </div>
        </div>
      </div>

    </div>
  </div>
</main>
  </div>

  <app-footer></app-footer>
`
})
export class ListingComponent implements OnInit {
  private annonceService = inject(AnnonceService);
    private router = inject(Router);  

  annonces = signal<AnnonceLocationDTO[]>([]);
  isLoading = signal(true);
  hasError = signal(false);

  // Filtres
  filterType = signal<string>('');
  filterMode = signal<string>('');
  filterPrixMax = signal<number>(3000);
  filterMeuble = signal<string>('');
  filterSurface = signal<number>(0);
  filterVille = signal<string>('');

  // Computed filtered list
filtered = computed(() =>
  this.annonces().filter(a =>
    a.etatAnnonce === 'PUBLIEE' &&

    (!this.filterType() || a.typeLogement === this.filterType()) &&
    (!this.filterMode() || a.modeLocation === this.filterMode()) &&
    (a.prixMensuel <= this.filterPrixMax()) &&
    (!this.filterMeuble() || a.typeMeublage === this.filterMeuble()) &&
    (a.surface >= this.filterSurface()) &&
    (
      !this.filterVille() ||
      a.adresse?.ville?.toLowerCase() === this.filterVille().toLowerCase()
    )
  )
);


  ngOnInit(): void {
    this.loadAnnonces();
  }

  private loadAnnonces(): void {
    this.annonceService.getAll().subscribe({
      next: (data) => {
        this.annonces.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des annonces:', err);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

onFilterChange(filters: {
  typeLogement: string;
  modeLocation: string;
  prixMax: number;
  meublage: string;
  surface: number;
  ville: string;
}): void {
  this.filterType.set(filters.typeLogement);
  this.filterMode.set(filters.modeLocation);
  this.filterPrixMax.set(filters.prixMax);
  this.filterMeuble.set(filters.meublage);
  this.filterSurface.set(filters.surface);
  this.filterVille.set(filters.ville);
}
  onMarkerClick(id: number): void {
    // Scroll to corresponding card
    const element = document.querySelector(`[data-annonce-id="${id}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
onUpdateAnnonce(id: number): void {
  console.log('🔧 navigating to:', `/annonces/${id}/modifier`);
  this.router.navigateByUrl(`/annonces/${id}/modifier`).then(success => {
    console.log('Navigation success:', success); // false = route not found
  });
}

onDeleteAnnonce(id: number): void {
  console.log('🗑️ delete clicked, id:', id);
  if (!confirm('Confirmer la suppression ?')) return;
  this.annonces.update(list => list.filter(a => a.idAnnonce !== id));
}
}
