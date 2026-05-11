import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChambreDTO } from '../../../../../../core/models/chambre';
import { PhotoDTO } from '../../../../../../core/models/photo';
import {
  PhotoValidatorService,
  ValidatablePhoto
} from '../../../../../../core/services/photo-validator.service';

@Component({
  selector: 'app-step3-photos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">

      <!-- BANNIÈRE ÉTAT DU MODÈLE IA -->
      <div *ngIf="photoValidator.isModelLoading()"
        class="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3">
        <div class="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
        <div>
          <p class="text-sm font-semibold text-indigo-700">Chargement du modèle de vérification IA...</p>
          <p class="text-xs text-indigo-500">Première utilisation uniquement (~10 sec)</p>
        </div>
      </div>

      <div *ngIf="photoValidator.isModelReady()"
        class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
        <span class="text-lg">🤖</span>
        <p class="text-sm font-semibold text-emerald-700">
          Vérification IA active — les photos seront analysées automatiquement
        </p>
      </div>

      <div *ngIf="photoValidator.modelError()"
        class="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
        <span class="text-lg">⚠️</span>
        <p class="text-sm text-amber-700">
          Modèle IA indisponible — les photos seront acceptées sans vérification
        </p>
      </div>

      <!-- SECTION A: PHOTOS DE L'ANNONCE -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-bold text-slate-800 mb-6">📸 Photos de l'annonce</h2>

        <!-- Drag & Drop Zone -->
        <div
          (dragover)="onDragOver($event); isDraggingAnnonce.set(true)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event, 'annonce')"
          [class.border-indigo-400]="isDraggingAnnonce()"
          [class.bg-indigo-50]="isDraggingAnnonce()"
          [class.border-slate-300]="!isDraggingAnnonce()"
          class="border-2 border-dashed rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
        >
          <p class="text-slate-600 text-sm font-semibold mb-2">📁 Glissez vos photos ici</p>
          <p class="text-slate-400 text-xs mb-4">ou</p>
          <label class="inline-block">
            <input #fileInputAnnonce type="file" multiple accept="image/*"
              (change)="onFilesSelected($event, 'annonce')" class="hidden" />
            <button type="button" (click)="fileInputAnnonce.click()"
              class="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
              Parcourir
            </button>
          </label>
          <p class="text-xs text-slate-400 mt-3">Formats acceptés : JPG, PNG, WebP • Max 10 photos</p>
        </div>

        <p class="text-xs text-slate-500 mt-3">{{ photosAnnonceList().length }}/10 photos</p>

        <!-- GRILLE DES PREVIEWS -->
        <div class="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-6" *ngIf="photosAnnonceList().length > 0">
          <div
            *ngFor="let photo of photosAnnonceList(); let i = index"
            class="relative rounded-lg overflow-hidden aspect-square bg-slate-100"
            [class.ring-2]="photo.validationStatus === 'invalid' || photo.validationStatus === 'valid'"
            [class.ring-red-400]="photo.validationStatus === 'invalid'"
            [class.ring-emerald-400]="photo.validationStatus === 'valid'"
            (mouseenter)="hoveredAnnonceIndex.set(i)"
            (mouseleave)="hoveredAnnonceIndex.set(null)"
          >
            <!-- Image -->
            <img [src]="photo.url" [alt]="photo.altText || 'Photo ' + (i + 1)"
              class="w-full h-full object-cover" />

            <!-- Validating overlay -->
            <div *ngIf="photo.validationStatus === 'validating'"
              class="absolute inset-0 bg-white/70 flex flex-col items-center justify-center backdrop-blur-sm">
              <div class="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mb-2"></div>
              <p class="text-xs font-semibold text-indigo-700">Analyse IA...</p>
            </div>

            <!-- Invalid overlay -->
            <div *ngIf="photo.validationStatus === 'invalid'"
              class="absolute inset-0 bg-red-500/60 flex flex-col items-center justify-center p-2">
              <span class="text-3xl mb-1">🚫</span>
              <p class="text-white text-xs text-center font-bold leading-tight">Pas une photo de logement</p>
              <p class="text-white/80 text-[10px] text-center mt-1">Détecté : {{ photo.validationLabel }}</p>
              <button type="button" (click)="deletePhoto('annonce', i)"
                class="mt-2 px-3 py-1 bg-white text-red-600 rounded-full text-xs font-bold hover:bg-red-50 transition">
                Supprimer
              </button>
            </div>

            <!-- Valid badge -->
            <div *ngIf="photo.validationStatus === 'valid'"
              class="absolute top-2 right-2 bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg"
              [title]="'Vérifié : ' + (photo.validationLabel || '') + ' (' + (photo.validationConfidence || 0) + '%)'">
              ✓
            </div>

            <!-- Error badge -->
            <div *ngIf="photo.validationStatus === 'error'"
              class="absolute top-2 right-2 bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg"
              title="Impossible de vérifier cette photo">
              ?
            </div>

            <!-- ── HOVER ACTIONS (Angular-controlled, no Tailwind group) ── -->
            <div
              *ngIf="(photo.validationStatus === 'valid' || photo.validationStatus === 'error') && hoveredAnnonceIndex() === i"
              class="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style="background: rgba(0,0,0,0.5);"
            >
              <div class="flex gap-2">
                <button type="button" (click)="movePhotoUp('annonce', i)" [disabled]="i === 0"
                  style="width:32px;height:32px;border-radius:50%;background:white;border:none;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;opacity:1;"
                  [style.opacity]="i === 0 ? '0.4' : '1'">
                  ▲
                </button>
                <button type="button" (click)="movePhotoDown('annonce', i)"
                  [disabled]="i === photosAnnonceList().length - 1"
                  style="width:32px;height:32px;border-radius:50%;background:white;border:none;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;"
                  [style.opacity]="i === photosAnnonceList().length - 1 ? '0.4' : '1'">
                  ▼
                </button>
              </div>
              <button type="button" (click)="deletePhoto('annonce', i)"
                style="width:32px;height:32px;border-radius:50%;background:#ef4444;color:white;border:none;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">
                ✕
              </button>
            </div>

            <!-- Numéro d'ordre -->
            <div class="absolute top-2 left-2 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {{ i + 1 }}
            </div>
          </div>
        </div>

        <!-- Alt text -->
        <div class="mt-6 space-y-3" *ngIf="photosAnnonceList().length > 0">
          <h3 class="text-sm font-semibold text-slate-700">Descriptions des photos</h3>
          <div *ngFor="let photo of photosAnnonceList(); let i = index" class="flex gap-2 items-start">
            <p class="text-xs text-slate-500 mt-2 w-6">{{ i + 1 }}.</p>
            <input type="text" [(ngModel)]="photo.altText" placeholder="Description de la photo"
              class="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
            <span *ngIf="photo.validationStatus === 'valid'" class="mt-2 text-emerald-500 text-xs whitespace-nowrap">
              ✓ {{ photo.validationLabel }}
            </span>
            <span *ngIf="photo.validationStatus === 'invalid'" class="mt-2 text-red-500 text-xs whitespace-nowrap">
              ✕ Rejetée
            </span>
          </div>
        </div>
      </div>

      <!-- SECTION B: PHOTOS PAR CHAMBRE -->
      <div *ngIf="modeLocation === 'PAR_CHAMBRE'" class="space-y-6">
        <div *ngFor="let chambre of chambres; let chambreIndex = index"
          class="bg-white rounded-xl shadow-sm p-6">

          <h3 class="text-lg font-bold text-slate-800 mb-6">
            📸 Photos — {{ chambre.titre || 'Chambre ' + (chambreIndex + 1) }}
          </h3>

          <!-- Drag & Drop Zone -->
          <div
            (dragover)="onDragOver($event); isDraggingChambreIndex.set(chambreIndex)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event, 'chambre', chambreIndex)"
            [class.border-indigo-400]="isDraggingChambreIndex() === chambreIndex"
            [class.bg-indigo-50]="isDraggingChambreIndex() === chambreIndex"
            [class.border-slate-300]="isDraggingChambreIndex() !== chambreIndex"
            class="border-2 border-dashed rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
          >
            <p class="text-slate-600 text-sm font-semibold mb-2">📁 Glissez les photos ici</p>
            <p class="text-slate-400 text-xs mb-4">ou</p>
            <label class="inline-block">
              <input #fileInputChambre type="file" multiple accept="image/*"
                (change)="onFilesSelected($event, 'chambre', chambreIndex)" class="hidden" />
              <button type="button" (click)="fileInputChambre.click()"
                class="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
                Parcourir
              </button>
            </label>
          </div>

          <p class="text-xs text-slate-500 mt-3">{{ photosChambre(chambreIndex).length }}/5 photos</p>

          <!-- Grille previews chambre -->
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-6"
            *ngIf="photosChambre(chambreIndex).length > 0">
            <div
              *ngFor="let photo of photosChambre(chambreIndex); let i = index"
              class="relative rounded-lg overflow-hidden aspect-square bg-slate-100"
              [class.ring-2]="photo.validationStatus === 'invalid' || photo.validationStatus === 'valid'"
              [class.ring-red-400]="photo.validationStatus === 'invalid'"
              [class.ring-emerald-400]="photo.validationStatus === 'valid'"
              (mouseenter)="hoveredChambre.set({ ci: chambreIndex, pi: i })"
              (mouseleave)="hoveredChambre.set(null)"
            >
              <img [src]="photo.url" [alt]="photo.altText || 'Photo ' + (i + 1)"
                class="w-full h-full object-cover" />

              <!-- Validating -->
              <div *ngIf="photo.validationStatus === 'validating'"
                class="absolute inset-0 bg-white/70 flex flex-col items-center justify-center backdrop-blur-sm">
                <div class="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mb-2"></div>
                <p class="text-xs font-semibold text-indigo-700">Analyse IA...</p>
              </div>

              <!-- Invalid -->
              <div *ngIf="photo.validationStatus === 'invalid'"
                class="absolute inset-0 bg-red-500/60 flex flex-col items-center justify-center p-2">
                <span class="text-3xl mb-1">🚫</span>
                <p class="text-white text-xs text-center font-bold">Pas une photo de logement</p>
                <button type="button" (click)="deletePhoto('chambre', i, chambreIndex)"
                  class="mt-2 px-3 py-1 bg-white text-red-600 rounded-full text-xs font-bold hover:bg-red-50 transition">
                  Supprimer
                </button>
              </div>

              <!-- Valid badge -->
              <div *ngIf="photo.validationStatus === 'valid'"
                class="absolute top-2 right-2 bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                ✓
              </div>

              <!-- Error badge -->
              <div *ngIf="photo.validationStatus === 'error'"
                class="absolute top-2 right-2 bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                ?
              </div>

              <!-- ── HOVER ACTIONS chambre ── -->
              <div
                *ngIf="(photo.validationStatus === 'valid' || photo.validationStatus === 'error') && hoveredChambre()?.ci === chambreIndex && hoveredChambre()?.pi === i"
                class="absolute inset-0 flex flex-col items-center justify-center gap-2"
                style="background: rgba(0,0,0,0.5);"
              >
                <div class="flex gap-2">
                  <button type="button" (click)="movePhotoUp('chambre', i, chambreIndex)" [disabled]="i === 0"
                    style="width:32px;height:32px;border-radius:50%;background:white;border:none;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;"
                    [style.opacity]="i === 0 ? '0.4' : '1'">
                    ▲
                  </button>
                  <button type="button" (click)="movePhotoDown('chambre', i, chambreIndex)"
                    [disabled]="i === photosChambre(chambreIndex).length - 1"
                    style="width:32px;height:32px;border-radius:50%;background:white;border:none;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;"
                    [style.opacity]="i === photosChambre(chambreIndex).length - 1 ? '0.4' : '1'">
                    ▼
                  </button>
                </div>
                <button type="button" (click)="deletePhoto('chambre', i, chambreIndex)"
                  style="width:32px;height:32px;border-radius:50%;background:#ef4444;color:white;border:none;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">
                  ✕
                </button>
              </div>

              <div class="absolute top-2 left-2 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {{ i + 1 }}
              </div>
            </div>
          </div>

          <!-- Alt text chambre -->
          <div class="mt-6 space-y-3" *ngIf="photosChambre(chambreIndex).length > 0">
            <h3 class="text-sm font-semibold text-slate-700">Descriptions des photos</h3>
            <div *ngFor="let photo of photosChambre(chambreIndex); let i = index"
              class="flex gap-2 items-start">
              <p class="text-xs text-slate-500 mt-2 w-6">{{ i + 1 }}.</p>
              <input type="text" [(ngModel)]="photo.altText" placeholder="Description de la photo"
                class="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
            </div>
          </div>
        </div>
      </div>

      <!-- ALERTE PHOTOS INVALIDES -->
      <div *ngIf="hasInvalidPhotos()"
        class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <span class="text-xl mt-0.5">🚫</span>
        <div>
          <p class="text-sm font-bold text-red-700">Photos non conformes détectées</p>
          <p class="text-xs text-red-600 mt-1">
            Certaines photos ne semblent pas être des photos de logement.
            Veuillez les supprimer ou les remplacer avant de publier.
          </p>
        </div>
      </div>

      <!-- BOUTONS -->
      <div class="flex justify-between gap-4 mt-8">
        <button type="button" (click)="onGoBack()"
          class="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold transition">
          ← Retour
        </button>
        <button type="button" (click)="onSubmit()" [disabled]="!canSubmit()"
          class="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed">
          <span *ngIf="isValidating()">
            <span class="inline-block animate-spin mr-2">⟳</span>
            Vérification en cours...
          </span>
          <span *ngIf="!isValidating()">✓ Publier l'annonce</span>
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class Step3PhotosComponent implements OnInit {
  @Input() modeLocation: string = 'ENTIER';
  @Input() chambres: Partial<ChambreDTO>[] = [];
  @Input() initialPhotos: { annonce: PhotoDTO[]; chambres: PhotoDTO[][] } = {
    annonce: [],
    chambres: []
  };
  @Output() goBack = new EventEmitter<void>();
  @Output() submitAnnonce = new EventEmitter<{
    annonce: PhotoDTO[];
    chambres: PhotoDTO[][];
  }>();

  photoValidator = inject(PhotoValidatorService);

  // ── Signals ──
  photosAnnonceList = signal<ValidatablePhoto[]>([]);
  photosChambres = signal<ValidatablePhoto[][]>([]);
  isDraggingAnnonce = signal(false);
  isDraggingChambreIndex = signal<number | null>(null);

  // ── Hover tracking (replaces Tailwind group-hover) ──
  hoveredAnnonceIndex = signal<number | null>(null);
  hoveredChambre = signal<{ ci: number; pi: number } | null>(null);

  private nextPhotoId = 1;

  isValidating = computed(() =>
    this.photosAnnonceList().some(p => p.validationStatus === 'validating') ||
    this.photosChambres().some(arr => arr.some(p => p.validationStatus === 'validating'))
  );

  hasInvalidPhotos = computed(() =>
    this.photosAnnonceList().some(p => p.validationStatus === 'invalid') ||
    this.photosChambres().some(arr => arr.some(p => p.validationStatus === 'invalid'))
  );

  canSubmit = computed(() => !this.isValidating() && !this.hasInvalidPhotos());

  ngOnInit(): void {
    this.photoValidator.loadModel();

    if (this.initialPhotos.annonce?.length > 0) {
      this.photosAnnonceList.set(
        this.initialPhotos.annonce.map(p => ({ ...p, validationStatus: 'valid' as const }))
      );
    }

    if (this.initialPhotos.chambres?.length > 0) {
      this.photosChambres.set(
        this.initialPhotos.chambres.map(arr =>
          arr.map(p => ({ ...p, validationStatus: 'valid' as const }))
        )
      );
    } else {
      this.photosChambres.set(this.chambres.map(() => []));
    }
  }

  photosAnnonce(): ValidatablePhoto[] { return this.photosAnnonceList(); }
  photosChambre(index: number): ValidatablePhoto[] { return this.photosChambres()[index] || []; }

  onDragOver(event: DragEvent): void { event.preventDefault(); event.stopPropagation(); }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    if ((event.target as HTMLElement).classList.contains('border-dashed')) {
      this.isDraggingAnnonce.set(false);
      this.isDraggingChambreIndex.set(null);
    }
  }

  onDrop(event: DragEvent, type: 'annonce' | 'chambre', chambreIndex?: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingAnnonce.set(false);
    this.isDraggingChambreIndex.set(null);
    const files = event.dataTransfer?.files;
    if (files) this.processFiles(Array.from(files), type, chambreIndex);
  }

  onFilesSelected(event: Event, type: 'annonce' | 'chambre', chambreIndex?: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(Array.from(input.files), type, chambreIndex);
      input.value = '';
    }
  }

  private async processFiles(files: File[], type: 'annonce' | 'chambre', chambreIndex?: number): Promise<void> {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      if (type === 'annonce' && this.photosAnnonceList().length >= 10) break;
      if (type === 'chambre' && chambreIndex !== undefined && this.photosChambre(chambreIndex).length >= 5) break;

      try {
        const base64 = await this.readFileAsDataURL(file);
        const photoId = this.nextPhotoId++;
        const photo: ValidatablePhoto = {
          id: photoId, url: base64, altText: '', ordre: 0,
          dateUpload: new Date().toISOString(), validationStatus: 'validating'
        };
        this.addPhotoToList(photo, type, chambreIndex);
        this.runValidation(photoId, base64, type, chambreIndex);
      } catch (error) {
        console.error('Erreur lecture fichier:', error);
      }
    }
  }

  private readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private addPhotoToList(photo: ValidatablePhoto, type: 'annonce' | 'chambre', chambreIndex?: number): void {
    if (type === 'annonce') {
      this.photosAnnonceList.update(arr => [...arr, photo]);
    } else if (type === 'chambre' && chambreIndex !== undefined) {
      this.photosChambres.update(all => {
        const updated = all.map(a => [...a]);
        updated[chambreIndex] = [...updated[chambreIndex], photo];
        return updated;
      });
    }
  }

  private async runValidation(photoId: number, base64: string, type: 'annonce' | 'chambre', chambreIndex?: number): Promise<void> {
    try {
      const result = await this.photoValidator.validateImage(base64);
      this.updatePhotoValidation(photoId, type, chambreIndex, {
        validationStatus: result.isValid ? 'valid' : 'invalid',
        validationLabel: result.label,
        validationConfidence: result.confidence
      });
    } catch {
      this.updatePhotoValidation(photoId, type, chambreIndex, {
        validationStatus: 'error', validationLabel: 'Erreur', validationConfidence: 0
      });
    }
  }

  private updatePhotoValidation(photoId: number, type: 'annonce' | 'chambre', chambreIndex: number | undefined, update: Partial<ValidatablePhoto>): void {
    if (type === 'annonce') {
      this.photosAnnonceList.update(arr => arr.map(p => p.id === photoId ? { ...p, ...update } : p));
    } else if (type === 'chambre' && chambreIndex !== undefined) {
      this.photosChambres.update(all => {
        const updated = all.map(a => [...a]);
        updated[chambreIndex] = updated[chambreIndex].map(p => p.id === photoId ? { ...p, ...update } : p);
        return updated;
      });
    }
  }

  movePhotoUp(type: 'annonce' | 'chambre', index: number, chambreIndex?: number): void {
    if (index === 0) return;
    if (type === 'annonce') {
      this.photosAnnonceList.update(arr => {
        const copy = [...arr];
        [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
        return copy;
      });
    } else if (type === 'chambre' && chambreIndex !== undefined) {
      this.photosChambres.update(all => {
        const updated = all.map(a => [...a]);
        [updated[chambreIndex][index - 1], updated[chambreIndex][index]] =
          [updated[chambreIndex][index], updated[chambreIndex][index - 1]];
        return updated;
      });
    }
  }

  movePhotoDown(type: 'annonce' | 'chambre', index: number, chambreIndex?: number): void {
    if (type === 'annonce') {
      if (index >= this.photosAnnonceList().length - 1) return;
      this.photosAnnonceList.update(arr => {
        const copy = [...arr];
        [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
        return copy;
      });
    } else if (type === 'chambre' && chambreIndex !== undefined) {
      if (index >= this.photosChambre(chambreIndex).length - 1) return;
      this.photosChambres.update(all => {
        const updated = all.map(a => [...a]);
        [updated[chambreIndex][index], updated[chambreIndex][index + 1]] =
          [updated[chambreIndex][index + 1], updated[chambreIndex][index]];
        return updated;
      });
    }
  }

  deletePhoto(type: 'annonce' | 'chambre', index: number, chambreIndex?: number): void {
    if (type === 'annonce') {
      this.photosAnnonceList.update(arr => arr.filter((_, i) => i !== index));
    } else if (type === 'chambre' && chambreIndex !== undefined) {
      this.photosChambres.update(all => {
        const updated = all.map(a => [...a]);
        updated[chambreIndex] = updated[chambreIndex].filter((_, i) => i !== index);
        return updated;
      });
    }
  }

  onGoBack(): void { this.goBack.emit(); }

  onSubmit(): void {
    if (!this.canSubmit()) return;
    this.submitAnnonce.emit({
      annonce: this.photosAnnonceList().map((p, i) => ({
        id: p.id, url: p.url, altText: p.altText, ordre: i + 1, dateUpload: p.dateUpload
      } as PhotoDTO)),
      chambres: this.photosChambres().map(arr =>
        arr.map((p, i) => ({
          id: p.id, url: p.url, altText: p.altText, ordre: i + 1, dateUpload: p.dateUpload
        } as PhotoDTO))
      )
    });
  }
}
