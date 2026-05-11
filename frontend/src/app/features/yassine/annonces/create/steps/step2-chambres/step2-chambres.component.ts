import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ChambreDTO } from '../../../../../../core/models/chambre';

@Component({
  selector: 'app-step2-chambres',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <!-- CAS 1: Mode ENTIER -->
  <div *ngIf="modeLocation === 'ENTIER'" class="bg-white rounded-xl shadow-sm p-6">
    <p class="text-slate-700 text-center py-8">
      ℹ️ Aucune chambre à renseigner pour une location de logement entier.
    </p>

    <!-- BOUTONS -->
    <div class="flex justify-between gap-4 mt-8">
      <button
        type="button"
        (click)="onGoBack()"
        class="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold transition"
      >
        ← Retour
      </button>
      <button
        type="button"
        (click)="skipChambres()"
        class="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
      >
        Suivant →
      </button>
    </div>
  </div>

  <!-- CAS 2: Mode PAR_CHAMBRE -->
  <form *ngIf="modeLocation === 'PAR_CHAMBRE'" [formGroup]="form" class="space-y-6">
    <div class="bg-white rounded-xl shadow-sm p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-lg font-bold text-slate-800">🛏️ Chambres</h2>
        <button
          type="button"
          (click)="addChambre()"
          class="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition"
        >
          + Ajouter une chambre
        </button>
      </div>

      <div formArrayName="chambres" class="space-y-6">
        <div
          *ngFor="let chambreGroup of chambresArray.controls; let i = index"
          [formGroupName]="i"
          class="border border-slate-200 rounded-xl p-5 bg-slate-50"
        >
          <!-- En-tête -->
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-semibold text-slate-800">Chambre {{ i + 1 }}</h3>
            <button
              *ngIf="chambresArray.length > 1"
              type="button"
              (click)="removeChambre(i)"
              class="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200 transition"
            >
              ✕ Supprimer
            </button>
          </div>

          <!-- Titre -->
          <div class="mb-4">
            <label class="block text-sm font-semibold text-slate-700 mb-1">
              Titre *
            </label>
            <input
              formControlName="titre"
              type="text"
              [placeholder]="'Chambre ' + (i + 1)"
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              [ngClass]="{
                'border-red-400 focus:ring-red-400': isChambreTouched(i, 'titre') && hasChambreError(i, 'titre')
              }"
              (blur)="markChambreTouched(i, 'titre')"
            />
            <div class="flex justify-between mt-1">
              <p
                *ngIf="isChambreTouched(i, 'titre') && hasChambreError(i, 'titre')"
                class="text-xs text-red-500"
              >
                {{ getChambreErrorMsg(i, 'titre') }}
              </p>
              <p class="text-xs text-slate-400 ml-auto">
                {{ getChambreTitreLength(i) }}/30
              </p>
            </div>
          </div>

          <!-- Description -->
          <div class="mb-4">
            <label class="block text-sm font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              formControlName="description"
              placeholder="Décrivez cette chambre..."
              rows="3"
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition"
            ></textarea>
            <p class="text-xs text-slate-400 text-right mt-1">
              {{ getChambreDescriptionLength(i) }}/200
            </p>
          </div>

          <!-- Surface & Prix -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">
                Surface *
              </label>
              <div class="relative">
                <input
                  formControlName="surface"
                  type="number"
                  placeholder="0"
                  min="1"
                  class="w-full px-4 py-2.5 pr-8 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  [ngClass]="{
                    'border-red-400 focus:ring-red-400': isChambreTouched(i, 'surface') && hasChambreError(i, 'surface')
                  }"
                  (blur)="markChambreTouched(i, 'surface')"
                />
                <span
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold"
                  >m²</span
                >
              </div>
              <p
                *ngIf="isChambreTouched(i, 'surface') && hasChambreError(i, 'surface')"
                class="text-xs text-red-500 mt-1"
              >
                {{ getChambreErrorMsg(i, 'surface') }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">
                Prix mensuel *
              </label>
              <div class="relative">
                <input
                  formControlName="prixMensuel"
                  type="number"
                  placeholder="0"
                  min="1"
                  class="w-full px-4 py-2.5 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-950 focus:border-transparent outline-none transition"
                  [ngClass]="{
                    'border-red-400 focus:ring-red-400': isChambreTouched(i, 'prixMensuel') && hasChambreError(i, 'prixMensuel')
                  }"
                  (blur)="markChambreTouched(i, 'prixMensuel')"
                />
                <span
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold"
                  >€</span
                >
              </div>
              <p
                *ngIf="isChambreTouched(i, 'prixMensuel') && hasChambreError(i, 'prixMensuel')"
                class="text-xs text-red-500 mt-1"
              >
                {{ getChambreErrorMsg(i, 'prixMensuel') }}
              </p>
            </div>
          </div>

          <!-- État -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">
              État de la chambre *
            </label>
            <select
              formControlName="etatChambre"
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              [ngClass]="{
                'border-red-400 focus:ring-red-400': isChambreTouched(i, 'etatChambre') && hasChambreError(i, 'etatChambre')
              }"
              (blur)="markChambreTouched(i, 'etatChambre')"
            >
              <option value="">-- Sélectionnez --</option>
              <option value="DISPONIBLE">✓ Disponible</option>
              <option value="RESERVEE">⏳ Réservée</option>
              <option value="LOUEE">🔒 Louée</option>
              <option value="HORS_SERVICE">⚠️ Hors service</option>
            </select>
            <p
              *ngIf="isChambreTouched(i, 'etatChambre') && hasChambreError(i, 'etatChambre')"
              class="text-xs text-red-500 mt-1"
            >
              {{ getChambreErrorMsg(i, 'etatChambre') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- BOUTONS -->
    <div class="flex justify-between gap-4 mt-8">
      <button
        type="button"
        (click)="onGoBack()"
        class="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold transition"
      >
        ← Retour
      </button>
      <button
        type="button"
        (click)="onNext()"
        [disabled]="form.invalid"
        class="px-8 py-2.5 bg-green-750 hover:bg-green-950 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Suivant →
      </button>
    </div>
  </form>
`,
  styles: []
})
export class Step2ChambresComponent implements OnInit {
  @Input() modeLocation!: string;
  @Input() initialData: Partial<ChambreDTO>[] = [];
  @Output() goBack = new EventEmitter<void>();
  @Output() stepComplete = new EventEmitter<Partial<ChambreDTO>[]>();

  private fb = inject(FormBuilder);
  form!: FormGroup;
  chambresTouched = new Map<number, Set<string>>();

  ngOnInit(): void {
    this.form = this.fb.group({
      chambres: this.fb.array([this.createChambreFormGroup()])
    });
    if (this.initialData && this.initialData.length > 0) {
      this.initialData.forEach(chambre => {
        this.chambresArray.push(this.createChambreFormGroup(chambre));
      });
    } else {
      // SINON, CRÉER UNE CHAMBRE VIDE
      this.chambresArray.push(this.createChambreFormGroup());
    }
  }



private createChambreFormGroup(data?: Partial<ChambreDTO>): FormGroup {
    return this.fb.group({
      idChambre: [data?.idChambre || null],
      titre: [data?.titre || '', [Validators.required, Validators.maxLength(30)]],
      description: [data?.description || '', Validators.maxLength(200)],
      surface: [data?.surface || '', [Validators.required, Validators.min(1)]],
      numero: [data?.numero || 1],
      prixMensuel: [data?.prixMensuel || '', [Validators.required, Validators.min(1)]],
      etatChambre: [data?.etatChambre || '', Validators.required],
      photos: [data?.photos || []]
    });
  }

  get chambresArray(): FormArray {
    return this.form.get('chambres') as FormArray;
  }

  addChambre(): void {
    this.chambresArray.push(this.createChambreFormGroup());
  }

  removeChambre(index: number): void {
    if (this.chambresArray.length > 1) {
      this.chambresArray.removeAt(index);
      this.chambresTouched.delete(index);
    }
  }
  skipChambres(): void {
  this.stepComplete.emit([]);
}

  onNext(): void {
    if (this.form.valid) {
      const chambres = this.chambresArray.value.map((c: any, i: number) => ({
        ...c,
        numero: i + 1
      }));
      this.stepComplete.emit(chambres);
    }
  }

  onGoBack(): void {
    this.goBack.emit();
  }

  markChambreTouched(index: number, fieldName: string): void {
    if (!this.chambresTouched.has(index)) {
      this.chambresTouched.set(index, new Set());
    }
    this.chambresTouched.get(index)!.add(fieldName);
  }

  isChambreTouched(index: number, fieldName: string): boolean {
    return this.chambresTouched.has(index) && this.chambresTouched.get(index)!.has(fieldName);
  }

  hasChambreError(index: number, fieldName: string): boolean {
    const chambreGroup = this.chambresArray.at(index) as FormGroup;
    const control = chambreGroup.get(fieldName);
    return !!(control && control.errors && this.isChambreTouched(index, fieldName));
  }

  getChambreErrorMsg(index: number, fieldName: string): string {
    const chambreGroup = this.chambresArray.at(index) as FormGroup;
    const control = chambreGroup.get(fieldName);
    if (!control?.errors) return '';

    if (control.errors['required']) return 'Ce champ est obligatoire';
    if (control.errors['maxlength'])
      return `Maximum ${control.errors['maxlength'].requiredLength} caractères`;
    if (control.errors['min']) return `Valeur minimum: ${control.errors['min'].min}`;

    return 'Erreur de validation';
  }

  getChambreTitreLength(index: number): number {
    const chambreGroup = this.chambresArray.at(index) as FormGroup;
    return chambreGroup.get('titre')?.value?.length || 0;
  }

  getChambreDescriptionLength(index: number): number {
    const chambreGroup = this.chambresArray.at(index) as FormGroup;
    return chambreGroup.get('description')?.value?.length || 0;
  }
}
