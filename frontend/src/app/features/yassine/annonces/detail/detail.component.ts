import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { AnnonceService } from '../../../../core/services/annonce.service';
import { AnnonceLocationDTO } from '../../../../core/models/annonce';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { PhotoGalleryComponent } from '../../../../shared/components/photo-gallery/photo-gallery.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ChambreCardComponent } from '../components/chambre-card/chambre-card.component';
import { MapDetailComponent } from '../components/map-view/map-view.component';
import { PrixFormatPipe } from '../../../../shared/pipes/prix-format.pipe';
import { TypeLogementPipe } from '../../../../shared/pipes/type-logement.pipe';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [
    CommonModule,
    FooterComponent,
    PhotoGalleryComponent,
    BadgeComponent,
    ChambreCardComponent,
    MapDetailComponent,
    PrixFormatPipe,
    TypeLogementPipe,
    SpinnerComponent
  ],
 template: `
    <div class="flex flex-col min-h-screen bg-slate-50">
      <div class="flex-1">
        <div *ngIf="isLoading()" class="flex justify-center py-12">
          <app-spinner></app-spinner>
        </div>

        <div *ngIf="!isLoading() && hasError()" class="max-w-7xl mx-auto px-4 py-12">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-red-700">Une erreur s'est produite lors du chargement de l'annonce.</p>
          </div>
        </div>

        <div *ngIf="!isLoading() && !hasError() && annonce()" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- Gallery -->
          <div class="mb-8">
            <app-photo-gallery [photos]="annonce()!.photos"></app-photo-gallery>
          </div>

          <!-- Main content -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left: Details -->
            <div class="lg:col-span-2">
              <!-- Header -->
              <div class="mb-8">
                <h1 class="text-3xl font-bold text-slate-800 mb-4">{{ annonce()!.titre }}</h1>
                <div class="flex flex-wrap gap-3 mb-4">
                  <app-badge
                    type="type-logement"
                    [value]="annonce()!.typeLogement"
                    [label]="annonce()!.typeLogement | typeLogement"
                  ></app-badge>
                  <app-badge
                    type="meublage"
                    [value]="annonce()!.typeMeublage"
                    [label]="formatMeublage()"
                  ></app-badge>
                  <app-badge
                    type="type-logement"
                    [value]="annonce()!.modeLocation"
                    [label]="formatModeLocation()"
                  ></app-badge>
                </div>

                <!-- Address -->
                <div class="text-slate-600 mb-4">
                  <p class="text-lg">
                    📍 {{ annonce()!.adresse.rue }}, {{ annonce()!.adresse.codePostal }}
                    {{ annonce()!.adresse.ville }}
                  </p>
                </div>
              </div>

              <!-- Caractéristiques -->
              <div class="bg-white rounded-lg p-6 shadow-md mb-8">
                <h3 class="text-xl font-bold text-slate-800 mb-4">Caractéristiques</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p class="text-sm text-slate-600">Surface</p>
                    <p class="text-lg font-bold">{{ annonce()!.surface }} m²</p>
                  </div>
                  <div>
                    <p class="text-sm text-slate-600">Pièces</p>
                    <p class="text-lg font-bold">{{ annonce()!.nombrePieces }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-slate-600">Étage</p>
                    <p class="text-lg font-bold">{{ annonce()!.etage }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-slate-600">Caution</p>
                    <p class="text-lg font-bold">{{ annonce()!.montantCaution | prixFormat:'' }}</p>
                  </div>
                </div>
              </div>

              <!-- Disponibilité -->
              <div class="bg-white rounded-lg p-6 shadow-md mb-8">
                <h3 class="text-xl font-bold text-slate-800 mb-4">Disponibilité</h3>
                <p class="text-slate-700">
                  Du <strong>{{ annonce()!.dateDisponibiliteDebut | date:'longDate' }}</strong> au
                  <strong>{{ annonce()!.dateDisponibiliteFin | date:'longDate' }}</strong>
                </p>
              </div>

              <!-- Description -->
              <div class="bg-white rounded-lg p-6 shadow-md mb-8">
                <h3 class="text-xl font-bold text-slate-800 mb-4">Description</h3>
                <p class="text-slate-700 whitespace-pre-wrap">{{ annonce()!.description }}</p>
              </div>

              <!-- Chambres -->
              <div *ngIf="annonce()!.modeLocation === 'PAR_CHAMBRE' && annonce()!.chambres.length > 0" class="mb-8">
                <h3 class="text-2xl font-bold text-slate-800 mb-6">Les chambres</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <app-chambre-card
                    *ngFor="let chambre of annonce()!.chambres"
                    [chambre]="chambre"
                  ></app-chambre-card>
                </div>
              </div>
            </div>

            <!-- Right: Contact Card & Mini Map -->
            <div class="lg:col-span-1">
              <!-- Contact Card -->
              <div class="bg-white rounded-lg shadow-md p-6 sticky top-24 mb-8">
                <div class="mb-6 pb-6 border-b border-slate-200">
                  <p class="text-3xl font-bold mb-2" style="color: #37524B;">
                    {{ annonce()!.prixMensuel | prixFormat }}
                  </p>
                  <p *ngIf="annonce()!.chargesMensuelles > 0" class="text-sm text-slate-600">
                    + {{ annonce()!.chargesMensuelles | prixFormat:' €' }} de charges
                  </p>
                  <p class="text-sm text-slate-600 mt-2">
                    Caution : {{ annonce()!.montantCaution | prixFormat:'' }}
                  </p>
                </div>

<button
  *ngIf="!estProprietaireConnecte()"
  (click)="contacterProprietaire()"
  class="w-full text-white py-3 rounded-lg font-bold mb-3 transition-colors"
  style="background-color: #37524B;"
  onmouseover="this.style.backgroundColor='#182B1F'"
  onmouseout="this.style.backgroundColor='#37524B'">
  Contacter le propriétaire
</button>
<p
  *ngIf="estProprietaireConnecte()"
  class="text-sm text-center text-slate-500 mb-3"
>
  Vous êtes le propriétaire de cette annonce.
</p>

                <button
                  (click)="toggleSaved()"
                  [ngClass]="saved() ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'"
                  class="w-full hover:opacity-80 py-3 rounded-lg font-medium transition-colors"
                >
                  {{ saved() ? '❤️ Annonce sauvegardée' : '🤍 Sauvegarder' }}
                </button>
              </div>

              <!-- Mini Map -->
              @if (mapLatitude() !== null && mapLongitude() !== null) {
                <div class="mt-6 rounded-lg overflow-hidden h-96">
                  <app-map-detail
                    [latitude]="mapLatitude()!"
                    [longitude]="mapLongitude()!"
                    [titre]="mapTitre()"
                  />
                </div>
              } @else {
                <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p class="text-yellow-700">📍 Localisation non disponible pour cette annonce</p>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>

    <app-footer></app-footer>
  `
})
export class DetailComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private annonceService = inject(AnnonceService);

  annonce = signal<AnnonceLocationDTO | null>(null);
  isLoading = signal(true);
  hasError = signal(false);
  saved = signal(false);

  mapLatitude = computed(() => this.annonce()?.adresse?.latitude ?? null);
  mapLongitude = computed(() => this.annonce()?.adresse?.longitude ?? null);
  mapTitre = computed(() => this.annonce()?.titre ?? 'Localisation');
  /*jai ajouter nouhaaaaaaa pour mon bouton ca */
  contacterProprietaire(): void {
    const id = this.annonce()?.idAnnonce;
    if (!id) return;

    this.router.navigate(['/demande-location', id]);
  }



  ngOnInit(): void {
    this.route.params.pipe(
      switchMap(params => {
        const id = parseInt(params['id'], 10);
        console.log('📄 Chargement de l\'annonce id:', id);
        return this.annonceService.getById(id);
      })
    ).subscribe({
      next: (data) => {
        console.log('✅ Annonce chargée:', data);
        this.annonce.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement:', err);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  toggleSaved(): void {
    this.saved.update(v => !v);
  }

  formatMeublage(): string {
    const map: Record<string, string> = {
      MEUBLE: 'Meublé',
      NON_MEUBLE: 'Non meublé',
      SEMI_MEUBLE: 'Semi-meublé'
    };
    return map[this.annonce()?.typeMeublage || ''] || '';
  }

  formatModeLocation(): string {
    const map: Record<string, string> = {
      ENTIER: 'Logement entier',
      PAR_CHAMBRE: 'Par chambre'
    };
    return map[this.annonce()?.modeLocation || ''] || '';
  }
  estProprietaireConnecte = computed(() => {
  const annonce = this.annonce();
  const userId = this.authService.getUserId();

  if (!annonce || !userId) return false;

  return annonce.proprietaireId === userId;
});
}
