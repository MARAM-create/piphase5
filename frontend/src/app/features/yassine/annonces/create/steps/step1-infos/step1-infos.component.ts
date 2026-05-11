import { Component, OnInit, Output, EventEmitter, inject, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { AnnonceLocationDTO } from '../../../../../../core/models/annonce';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-step1-infos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" class="space-y-6">
      <!-- SECTION: INFORMATIONS GÉNÉRALES -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-bold text-slate-800 mb-4">
          📝 Informations générales
        </h2>

        <!-- Titre -->
        <div class="mb-5">
          <label class="block text-sm font-semibold text-slate-700 mb-1">
            Titre de l'annonce *
          </label>
          <input
            formControlName="titre"
            type="text"
            placeholder="Ex: Studio lumineux proche du centre-ville"
            class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-950 focus:border-transparent outline-none transition"
            [ngClass]="{
              'border-red-400 focus:ring-red-400': isTouched('titre') && hasError('titre')
            }"
            (blur)="markTouched('titre')"
          />
          <div class="flex justify-between items-center mt-1">
            <p
              *ngIf="isTouched('titre') && hasError('titre')"
              class="text-xs text-red-500"
            >
              {{ getErrorMsg('titre') }}
            </p>
            <p class="text-xs text-slate-400 ml-auto">
              {{ getTitreLength() }}/40
            </p>
          </div>
        </div>

        <!-- Description -->
        <div class="mb-5">
          <label class="block text-sm font-semibold text-slate-700 mb-1">
            Description *
          </label>
          <textarea
            formControlName="description"
            placeholder="Décrivez votre logement en détail..."
            rows="4"
            class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition"
            [ngClass]="{
              'border-red-400 focus:ring-red-400': isTouched('description') && hasError('description')
            }"
            (blur)="markTouched('description')"
          ></textarea>
          <div class="flex justify-between items-center mt-1">
            <p
              *ngIf="isTouched('description') && hasError('description')"
              class="text-xs text-red-500"
            >
              {{ getErrorMsg('description') }}
            </p>
            <p class="text-xs text-slate-400 ml-auto">
              {{ getDescriptionLength() }}/500
            </p>
          </div>
        </div>

        <!-- Type de logement -->
        <div class="mb-5">
          <label class="block text-sm font-semibold text-slate-700 mb-2">
            Type de logement *
          </label>
          <select
            formControlName="typeLogement"
            class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-950 focus:border-transparent outline-none transition"
            [ngClass]="{
              'border-red-400 focus:ring-red-400': isTouched('typeLogement') && hasError('typeLogement')
            }"
            (blur)="markTouched('typeLogement')"
          >
            <option value="">-- Sélectionnez --</option>
            <option value="STUDIO">Studio</option>
            <option value="APPARTEMENT">Appartement</option>
            <option value="MAISON">Maison</option>
            <option value="COLOCATION">Colocation</option>
            <option value="CHAMBRE_SEULE">Chambre seule</option>
          </select>
          <p
            *ngIf="isTouched('typeLogement') && hasError('typeLogement')"
            class="text-xs text-red-500 mt-1"
          >
            {{ getErrorMsg('typeLogement') }}
          </p>
        </div>

        <!-- Mode de location -->
        <div class="mb-5">
          <label class="block text-sm font-semibold text-slate-700 mb-3">
            Mode de location *
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              *ngFor="let option of modeLocationOptions"
              (click)="form.get('modeLocation')?.setValue(option.value)"
              [ngClass]="{
                'border-green-950 bg-indigo-50': form.get('modeLocation')?.value === option.value,
                'border-slate-200 hover:border-slate-400':
                  form.get('modeLocation')?.value !== option.value
              }"
              class="border-2 rounded-xl p-4 cursor-pointer transition-all"
            >
              <p class="font-semibold text-slate-800">{{ option.label }}</p>
              <p class="text-xs text-slate-500 mt-1">{{ option.description }}</p>
            </div>
          </div>
          <p
            *ngIf="isTouched('modeLocation') && hasError('modeLocation')"
            class="text-xs text-red-500 mt-2"
          >
            {{ getErrorMsg('modeLocation') }}
          </p>
        </div>

        <!-- Type de meublage -->
        <div class="mb-5">
          <label class="block text-sm font-semibold text-slate-700 mb-3">
            Type de meublage *
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              *ngFor="let option of typeMeublageOptions"
              (click)="form.get('typeMeublage')?.setValue(option.value)"
              [ngClass]="{
                'border-green-950 bg-indigo-50': form.get('typeMeublage')?.value === option.value,
                'border-slate-200 hover:border-slate-400':
                  form.get('typeMeublage')?.value !== option.value
              }"
              class="border-2 rounded-xl p-4 cursor-pointer transition-all"
            >
              <p class="font-semibold text-slate-800">{{ option.label }}</p>
            </div>
          </div>
          <p
            *ngIf="isTouched('typeMeublage') && hasError('typeMeublage')"
            class="text-xs text-red-500 mt-2"
          >
            {{ getErrorMsg('typeMeublage') }}
          </p>
        </div>
      </div>

      <!-- SECTION: TARIFS -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-bold text-slate-800 mb-4">💰 Tarifs</h2>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  'border-red-400 focus:ring-red-400': isTouched('prixMensuel') && hasError('prixMensuel')
                }"
                (blur)="markTouched('prixMensuel')"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">€/mois</span>
            </div>
            <p
              *ngIf="isTouched('prixMensuel') && hasError('prixMensuel')"
              class="text-xs text-red-500 mt-1"
            >
              {{ getErrorMsg('prixMensuel') }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">
              Charges mensuelles
            </label>
            <div class="relative">
              <input
                formControlName="chargesMensuelles"
                type="number"
                placeholder="0"
                min="0"
                class="w-full px-4 py-2.5 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-950 focus:border-transparent outline-none transition"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">€/mois</span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">
              Montant caution
            </label>
            <div class="relative">
              <input
                formControlName="montantCaution"
                type="number"
                placeholder="0"
                min="0"
                class="w-full px-4 py-2.5 pr-8 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-950 focus:border-transparent outline-none transition"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">€</span>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION: CARACTÉRISTIQUES -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-bold text-slate-800 mb-4">📐 Caractéristiques</h2>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                class="w-full px-4 py-2.5 pr-8 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-950focus:border-transparent outline-none transition"
                [ngClass]="{
                  'border-red-400 focus:ring-red-400': isTouched('surface') && hasError('surface')
                }"
                (blur)="markTouched('surface')"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">m²</span>
            </div>
            <p
              *ngIf="isTouched('surface') && hasError('surface')"
              class="text-xs text-red-500 mt-1"
            >
              {{ getErrorMsg('surface') }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">
              Nombre de pièces *
            </label>
            <input
              formControlName="nombrePieces"
              type="number"
              placeholder="0"
              min="1"
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-950 focus:border-transparent outline-none transition"
              [ngClass]="{
                'border-red-400 focus:ring-red-400': isTouched('nombrePieces') && hasError('nombrePieces')
              }"
              (blur)="markTouched('nombrePieces')"
            />
            <p
              *ngIf="isTouched('nombrePieces') && hasError('nombrePieces')"
              class="text-xs text-red-500 mt-1"
            >
              {{ getErrorMsg('nombrePieces') }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">
              Étage (0 = RDC)
            </label>
            <input
              formControlName="etage"
              type="number"
              placeholder="0"
              min="0"
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-950 focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════ -->
      <!-- SECTION DISPONIBILITÉ — CORRIGÉE                   -->
      <!-- ═══════════════════════════════════════════════════ -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-bold text-slate-800 mb-4">
          📅 Disponibilité
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Date début -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">
              Date de disponibilité *
            </label>
            <input
              formControlName="dateDisponibiliteDebut"
              type="date"
              [min]="todayDate"
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-950 focus:border-transparent outline-none transition"
              [ngClass]="{
                'border-red-400 focus:ring-red-400': isTouched('dateDisponibiliteDebut') && hasError('dateDisponibiliteDebut')
              }"
              (blur)="markTouched('dateDisponibiliteDebut')"
            />
            <p
              *ngIf="isTouched('dateDisponibiliteDebut') && hasError('dateDisponibiliteDebut')"
              class="text-xs text-red-500 mt-1"
            >
              {{ getErrorMsg('dateDisponibiliteDebut') }}
            </p>
          </div>

          <!-- Date fin — avec [min] dynamique -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">
              Date de fin (optionnel)
            </label>
            <input
              formControlName="dateDisponibiliteFin"
              type="date"
              [min]="form.get('dateDisponibiliteDebut')?.value || todayDate"
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-950 focus:border-transparent outline-none transition"
              [ngClass]="{
                'border-red-400 focus:ring-red-400': isTouched('dateDisponibiliteFin') && hasError('dateDisponibiliteFin')
              }"
              (blur)="markTouched('dateDisponibiliteFin')"
            />
            <p
              *ngIf="isTouched('dateDisponibiliteFin') && hasError('dateDisponibiliteFin')"
              class="text-xs text-red-500 mt-1"
            >
              {{ getErrorMsg('dateDisponibiliteFin') }}
            </p>
          </div>
        </div>

        <!-- Message d'alerte contextuel -->
        <div
          *ngIf="form.get('dateDisponibiliteDebut')?.value && form.get('dateDisponibiliteFin')?.value && !hasError('dateDisponibiliteFin')"
          class="mt-3 flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg"
        >
          ✅ Disponible du {{ form.get('dateDisponibiliteDebut')?.value }} au {{ form.get('dateDisponibiliteFin')?.value }}
        </div>
      </div>

      <!-- SECTION: ADRESSE -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-bold text-slate-800 mb-4">📍 Adresse</h2>

        <div class="mb-4">
          <label class="block text-sm font-semibold text-slate-700 mb-1">Rue *</label>
          <input
            formControlName="rue"
            type="text"
            placeholder="Ex: 123 Avenue Habib Bourguiba"
            class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-950 focus:border-transparent outline-none transition"
            [ngClass]="{
              'border-red-400 focus:ring-red-400': isTouched('rue') && hasError('rue')
            }"
            (blur)="markTouched('rue')"
          />
          <p *ngIf="isTouched('rue') && hasError('rue')" class="text-xs text-red-500 mt-1">
            {{ getErrorMsg('rue') }}
          </p>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-semibold text-slate-700 mb-1">Ville *</label>
          <input
            formControlName="ville"
            type="text"
            placeholder="Ex: Tunis"
            class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-950 focus:border-transparent outline-none transition"
            [ngClass]="{
              'border-red-400 focus:ring-red-400': isTouched('ville') && hasError('ville')
            }"
            (blur)="markTouched('ville')"
          />
          <p *ngIf="isTouched('ville') && hasError('ville')" class="text-xs text-red-500 mt-1">
            {{ getErrorMsg('ville') }}
          </p>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-semibold text-slate-700 mb-1">Code postal *</label>
          <input
            formControlName="codePostal"
            type="text"
            placeholder="Ex: 1002"
            class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-950 focus:border-transparent outline-none transition"
            [ngClass]="{
              'border-red-400 focus:ring-red-400': isTouched('codePostal') && hasError('codePostal')
            }"
            (blur)="markTouched('codePostal')"
          />
          <p *ngIf="isTouched('codePostal') && hasError('codePostal')" class="text-xs text-red-500 mt-1">
            {{ getErrorMsg('codePostal') }}
          </p>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-semibold text-slate-700 mb-1">Pays *</label>
          <input
            formControlName="pays"
            type="text"
            placeholder="Tunisie"
            class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-950 focus:border-transparent outline-none transition"
            [ngClass]="{
              'border-red-400 focus:ring-red-400': isTouched('pays') && hasError('pays')
            }"
            (blur)="markTouched('pays')"
          />
          <p *ngIf="isTouched('pays') && hasError('pays')" class="text-xs text-red-500 mt-1">
            {{ getErrorMsg('pays') }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Latitude (optionnel)</label>
            <input
              formControlName="latitude"
              type="number"
              placeholder="36.806389"
              step="0.000001"
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-950 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Longitude (optionnel)</label>
            <input
              formControlName="longitude"
              type="number"
              placeholder="10.181667"
              step="0.000001"
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-950 focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      <!-- BOUTONS -->
      <div class="flex justify-end gap-4 mt-8">
        <button
          type="button"
          (click)="onNext()"
          [disabled]="form.invalid"
          class="px-8 py-2.5 bg-green-950 hover:bg-green-950 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Suivant →
        </button>
      </div>
    </form>
  `,
  styles: []
})
export class Step1InfosComponent implements OnInit, OnDestroy {
  @Input() initialData: Partial<AnnonceLocationDTO> = {};
  @Output() stepComplete = new EventEmitter<Partial<AnnonceLocationDTO>>();

  private fb = inject(FormBuilder);
  form!: FormGroup;
  touchedFields = new Set<string>();
  todayDate: string = '';

  // ✅ Subscription pour nettoyer à la destruction
  private dateSub?: Subscription;

  modeLocationOptions = [
    {
      value: 'ENTIER',
      label: '🏠 Logement entier',
      description: 'Location du logement complet'
    },
    {
      value: 'PAR_CHAMBRE',
      label: '🛏️ Par chambre',
      description: 'Location chambre par chambre'
    }
  ];

  typeMeublageOptions = [
    { value: 'MEUBLE', label: '✓ Meublé' },
    { value: 'SEMI_MEUBLE', label: '≈ Semi-meublé' },
    { value: 'NON_MEUBLE', label: '⊘ Non meublé' }
  ];

  ngOnInit(): void {
    // ✅ Date du jour au format YYYY-MM-DD pour l'attribut [min]
    this.todayDate = new Date().toISOString().split('T')[0];

    this.form = this.fb.group({
      titre:                   ['', [Validators.required, Validators.maxLength(40)]],
      description:             ['', [Validators.required, Validators.maxLength(500)]],
      typeLogement:            ['', Validators.required],
      modeLocation:            ['', Validators.required],
      typeMeublage:            ['', Validators.required],
      prixMensuel:             ['', [Validators.required, Validators.min(1)]],
      chargesMensuelles:       ['', Validators.min(0)],
      montantCaution:          ['', Validators.min(0)],
      surface:                 ['', [Validators.required, Validators.min(1)]],
      nombrePieces:            ['', [Validators.required, Validators.min(1)]],
      etage:                   [0, Validators.min(0)],
      dateDisponibiliteDebut:  ['', Validators.required],
      dateDisponibiliteFin:    [''],
      rue:                     ['', Validators.required],
      ville:                   ['', Validators.required],
      codePostal:              ['', Validators.required],
      pays:                    ['Tunisie', Validators.required],
      latitude:                [null],
      longitude:               [null]
    });

    // ═══════════════════════════════════════════════════════
    // ✅ QUAND LA DATE DÉBUT CHANGE → RE-VALIDER LA DATE FIN
    //    + vider la date fin si elle devient incohérente
    // ═══════════════════════════════════════════════════════
    this.dateSub = this.form.get('dateDisponibiliteDebut')!.valueChanges
      .subscribe(dateDebut => {
        const dateFinControl = this.form.get('dateDisponibiliteFin')!;
        const dateFin = dateFinControl.value;

        if (dateDebut && dateFin && new Date(dateFin) < new Date(dateDebut)) {
          // Option 1 : vider la date fin automatiquement
          dateFinControl.setValue('');
          // Option 2 (alternative) : juste re-valider
          // dateFinControl.updateValueAndValidity();
        }
      });

    // ✅ PRÉ-REMPLIR LE FORMULAIRE
    if (this.initialData && Object.keys(this.initialData).length > 0) {
      Object.keys(this.initialData).forEach(key => {
        const control = this.form.get(key);
        if (control && key !== 'adresse') {
          control.setValue((this.initialData as any)[key]);
        }
      });
      const adresse = (this.initialData as any).adresse;
      if (adresse) {
        this.form.patchValue({
          rue:        adresse.rue,
          ville:      adresse.ville,
          codePostal: adresse.codePostal,
          pays:       adresse.pays,
          latitude:   adresse.latitude,
          longitude:  adresse.longitude
        });
      }
    }

    // ✅ Appliquer le validateur personnalisé sur dateDisponibiliteFin
    this.form.get('dateDisponibiliteFin')!.addValidators(
      this.dateFinValidator.bind(this)
    );
  }

  ngOnDestroy(): void {
    this.dateSub?.unsubscribe();
  }

  // ═══════════════════════════════════════════════
  // ✅ VALIDATEUR AU NIVEAU DU CONTRÔLE (pas du groupe)
  //    → Plus fiable, pas de conflit setErrors
  // ═══════════════════════════════════════════════
  private dateFinValidator(control: AbstractControl): ValidationErrors | null {
    const dateFin = control.value;
    const dateDebut = this.form?.get('dateDisponibiliteDebut')?.value;

    // Pas de date fin = pas d'erreur (le champ est optionnel)
    if (!dateFin) return null;

    // Pas encore de date début = on ne peut pas comparer
    if (!dateDebut) return null;

    // ✅ Comparaison fiable avec des objets Date
    const debut = new Date(dateDebut);
    const fin   = new Date(dateFin);

    if (fin < debut) {
      return { dateFinAvantDebut: true };
    }

    // ✅ Bonus : date fin = date début → même jour interdit ?
    // if (fin.getTime() === debut.getTime()) {
    //   return { dateFinEgaleDebut: true };
    // }

    return null;
  }

  onNext(): void {
    if (this.form.valid) {
      this.stepComplete.emit(this.form.value);
    }
  }

  markTouched(fieldName: string): void {
    this.touchedFields.add(fieldName);
  }

  isTouched(fieldName: string): boolean {
    return this.touchedFields.has(fieldName);
  }

  hasError(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.errors && this.isTouched(fieldName));
  }

  getErrorMsg(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors) return '';

    if (control.errors['required'])
      return 'Ce champ est obligatoire';
    if (control.errors['minlength'])
      return `Minimum ${control.errors['minlength'].requiredLength} caractères`;
    if (control.errors['maxlength'])
      return `Maximum ${control.errors['maxlength'].requiredLength} caractères`;
    if (control.errors['min'])
      return `Valeur minimum: ${control.errors['min'].min}`;

    // ✅ Erreur personnalisée — directement sur le contrôle
    if (control.errors['dateFinAvantDebut'])
      return 'La date de fin doit être après la date de début';

    return 'Erreur de validation';
  }

  getTitreLength(): number {
    return this.form.get('titre')?.value?.length || 0;
  }

  getDescriptionLength(): number {
    return this.form.get('description')?.value?.length || 0;
  }
}
