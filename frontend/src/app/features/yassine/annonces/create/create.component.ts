import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { Step1InfosComponent } from './steps/step1-infos/step1-infos.component';
import { Step2ChambresComponent } from './steps/step2-chambres/step2-chambres.component';
import { Step3PhotosComponent } from './steps/step3-photos/step3-photos.component';
import { AnnonceService } from '../../../../core/services/annonce.service';
import { AnnonceLocationDTO } from '../../../../core/models/annonce';
import { ChambreDTO } from '../../../../core/models/chambre';
import { PhotoDTO } from '../../../../core/models/photo';
import { ToasterService } from '../../../../core/services/toaster.service';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [
    CommonModule,
    FooterComponent,
    Step1InfosComponent,
    Step2ChambresComponent,
    Step3PhotosComponent
  ],
  template: `
    <main class="min-h-screen bg-slate-50 py-12">
      <div class="max-w-4xl mx-auto px-4">

        <!-- PAGE TITLE -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-green-950">
            {{ isEditMode() ? 'Modifier l\'annonce' : 'Créer une annonce' }}
          </h1>
          <p class="text-slate-500 text-sm mt-1">
            {{ isEditMode() ? 'Mettez à jour les informations de votre annonce' : 'Publiez votre logement en 3 étapes' }}
          </p>
        </div>

        <!-- LOADING SKELETON (fetching existing annonce) -->
        <div *ngIf="isFetching()" class="flex justify-center py-20">
          <div class="w-8 h-8 border-4 border-green-950 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <ng-container *ngIf="!isFetching()">
          <!-- STEPPER -->
          <div class="flex items-center justify-center mb-12">
            <div class="flex items-center w-full max-w-md mx-auto">

              <!-- Step 1 -->
              <div class="flex flex-col items-center flex-1">
                <div
                  [ngClass]="{
                    'bg-green-950 text-white': currentStep() >= 1,
                    'bg-gray-200 text-gray-500': currentStep() < 1
                  }"
                  class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                >
                  {{ currentStep() > 1 ? '✓' : '1' }}
                </div>
                <p
                  [ngClass]="{
                    'text-green-950 font-semibold': currentStep() === 1,
                    'text-slate-600': currentStep() !== 1
                  }"
                  class="text-xs mt-2 text-center"
                >Annonce</p>
              </div>

              <div
                [ngClass]="{ 'bg-green-950': currentStep() > 1, 'bg-gray-300': currentStep() <= 1 }"
                class="flex-1 h-0.5 mx-2 transition-colors"
              ></div>

              <!-- Step 2 -->
              <div class="flex flex-col items-center flex-1">
                <div
                  [ngClass]="{
                    'bg-green-950 text-white': currentStep() >= 2,
                    'bg-gray-200 text-gray-500': currentStep() < 2
                  }"
                  class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                >
                  {{ currentStep() > 2 ? '✓' : '2' }}
                </div>
                <p
                  [ngClass]="{
                    'text-green-950 font-semibold': currentStep() === 2,
                    'text-slate-600': currentStep() !== 2
                  }"
                  class="text-xs mt-2 text-center"
                >Chambres</p>
              </div>

              <div
                [ngClass]="{ 'bg-green-950': currentStep() > 2, 'bg-gray-300': currentStep() <= 2 }"
                class="flex-1 h-0.5 mx-2 transition-colors"
              ></div>

              <!-- Step 3 -->
              <div class="flex flex-col items-center flex-1">
                <div
                  [ngClass]="{
                    'bg-green-950 text-white': currentStep() >= 3,
                    'bg-gray-200 text-gray-500': currentStep() < 3
                  }"
                  class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                >
                  {{ currentStep() > 3 ? '✓' : '3' }}
                </div>
                <p
                  [ngClass]="{
                    'text-green-950 font-semibold': currentStep() === 3,
                    'text-slate-600': currentStep() !== 3
                  }"
                  class="text-xs mt-2 text-center"
                >Photos</p>
              </div>

            </div>
          </div>

          <!-- STEP 1 -->
          <app-step1-infos
            *ngIf="currentStep() === 1"
            [initialData]="step1Data()"
            (stepComplete)="onStep1Complete($event)"
          ></app-step1-infos>

          <!-- STEP 2 -->
          <app-step2-chambres
            *ngIf="currentStep() === 2"
            [modeLocation]="step1Data().modeLocation || 'ENTIER'"
            [initialData]="step2Data()"
            (goBack)="goBack()"
            (stepComplete)="onStep2Complete($event)"
          ></app-step2-chambres>

          <!-- STEP 3 -->
          <app-step3-photos
            *ngIf="currentStep() === 3"
            [modeLocation]="step1Data().modeLocation || 'ENTIER'"
            [chambres]="step2Data()"
            [initialPhotos]="step3PhotosData()"
            (goBack)="goBack()"
            (submitAnnonce)="onSubmitAnnonce($event)"
          ></app-step3-photos>
        </ng-container>

        <!-- LOADING OVERLAY (submitting) -->
        <div
          *ngIf="isLoading()"
          class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
        >
          <div class="bg-white rounded-lg p-6 shadow-lg">
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 border-4 border-green-950 border-t-transparent rounded-full animate-spin"></div>
              <p class="text-slate-700 font-semibold">
                {{ isEditMode() ? 'Mise à jour en cours...' : 'Création en cours...' }}
              </p>
            </div>
          </div>
        </div>

        <!-- ERROR MESSAGE -->
        <div
          *ngIf="errorMessage()"
          class="mt-6 bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <p class="text-red-700 font-semibold">⚠️ {{ errorMessage() }}</p>
        </div>

      </div>
    </main>

    <app-footer></app-footer>
  `
})
export class CreateComponent implements OnInit {
  private annonceService = inject(AnnonceService);
  private router         = inject(Router);
  private route          = inject(ActivatedRoute);
  private toaster        = inject(ToasterService);

  // ── Mode ──────────────────────────────────────────────────────
  editId = signal<number | null>(null);
  isEditMode = () => this.editId() !== null;

  // ── State ─────────────────────────────────────────────────────
  currentStep      = signal<1 | 2 | 3>(1);
  step1Data        = signal<Partial<AnnonceLocationDTO>>({});
  step2Data        = signal<Partial<ChambreDTO>[]>([]);
  step3PhotosData  = signal<{ annonce: PhotoDTO[]; chambres: PhotoDTO[][] }>({ annonce: [], chambres: [] });
  isLoading        = signal(false);
  isFetching       = signal(false);
  errorMessage     = signal('');

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      // Edit mode — load existing annonce and pre-fill steps
      this.editId.set(+id);
      this.loadAnnonce(+id);
    }
    // else: create mode — signals already initialised to empty
  }

  // ── Load existing annonce for edit mode ───────────────────────
  private loadAnnonce(id: number): void {
    this.isFetching.set(true);

    this.annonceService.getById(id).subscribe({
      next: (annonce: AnnonceLocationDTO) => {
        // Pre-fill step 1 — flatten adresse into step1Data
        this.step1Data.set({
          ...annonce,
          // flatten address fields so Step1 form can bind them directly
          ...annonce.adresse
        } as any);

        // Pre-fill step 2 — chambres
        this.step2Data.set(annonce.chambres ?? []);

        // Pre-fill step 3 — photos
        this.step3PhotosData.set({
          annonce:  annonce.photos ?? [],
          chambres: (annonce.chambres ?? []).map(c => c.photos ?? [])
        });

        this.isFetching.set(false);
      },
      error: (err) => {
        this.isFetching.set(false);
        this.errorMessage.set('Impossible de charger l\'annonce.');
        console.error('❌ Erreur chargement annonce:', err);
      }
    });
  }

  // ── Step navigation ───────────────────────────────────────────
  onStep1Complete(data: Partial<AnnonceLocationDTO>): void {
    this.step1Data.set(data);
    this.currentStep.set(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onStep2Complete(data: Partial<ChambreDTO>[]): void {
    this.step2Data.set(data);
    this.currentStep.set(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goBack(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => (s - 1) as 1 | 2 | 3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ── Submit ────────────────────────────────────────────────────
  onSubmitAnnonce(photosData: { annonce: PhotoDTO[]; chambres: PhotoDTO[][] }): void {
    this.step3PhotosData.set(photosData);
    this.errorMessage.set('');
    this.isLoading.set(true);

    const dto = this.buildDto(photosData);

    console.log('📤 DTO envoyé:', JSON.stringify(dto, null, 2));

    if (this.isEditMode()) {
      // ── UPDATE ──
      this.annonceService.update(this.editId()!, dto as AnnonceLocationDTO).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.toaster.success('✓ Annonce mise à jour avec succès !');
          this.router.navigate(['/annonces', this.editId()]);
        },
        error: (err: any) => this.handleError(err)
      });
    } else {
      // ── CREATE ──
      this.annonceService.create(dto as AnnonceLocationDTO).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.toaster.success('✓ Annonce créée avec succès !');
          this.router.navigate(['/annonces']);
        },
        error: (err: any) => this.handleError(err)
      });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────
// buildDto in create.component.ts — fix it by adding idAnnonce and version
private buildDto(photosData: { annonce: PhotoDTO[]; chambres: PhotoDTO[][] }) {
  const step1 = this.step1Data() as any;

  const cleanPhotos = (photos: PhotoDTO[]): Partial<PhotoDTO>[] =>
    (photos || []).map(({ id, ...rest }) => rest);

  const chambres = this.step2Data().map((chambre, index) => ({
    ...chambre,
    numero: index + 1,
    photos: cleanPhotos(photosData.chambres[index] || [])
  }));

  return {
    idAnnonce:              this.isEditMode() ? this.editId() : undefined,  // ← ADD THIS
    version:                step1.version ?? null,                           // ← ADD THIS
    titre:                  step1.titre,
    description:            step1.description,
    typeLogement:           step1.typeLogement,
    modeLocation:           step1.modeLocation,
    typeMeublage:           step1.typeMeublage,
    prixMensuel:            step1.prixMensuel,
    chargesMensuelles:      step1.chargesMensuelles,
    montantCaution:         step1.montantCaution,
    surface:                step1.surface,
    nombrePieces:           step1.nombrePieces,
    etage:                  step1.etage,
    dateDisponibiliteDebut: step1.dateDisponibiliteDebut,
    dateDisponibiliteFin:   step1.dateDisponibiliteFin,
    etatAnnonce:            step1.etatAnnonce    ?? 'BROUILLON',
    statutModeration:       step1.statutModeration ?? 'EN_ATTENTE',
    adresse: {
      rue:        step1.rue,
      ville:      step1.ville,
      codePostal: step1.codePostal,
      pays:       step1.pays,
      latitude:   step1.latitude  ?? null,
      longitude:  step1.longitude ?? null
    },
    photos:   cleanPhotos(photosData.annonce),
    chambres
  };
}

  private handleError(err: any): void {
    this.isLoading.set(false);
    const msg = err?.error?.message || 'Une erreur est survenue.';
    this.errorMessage.set(msg);
    console.error('❌ Erreur:', err);
  }
}
