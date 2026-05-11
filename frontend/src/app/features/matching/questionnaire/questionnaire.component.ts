import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatchingService, QuestionnaireDTO } from '../../../core/services/matching.service';
import { FooterComponent } from '../../../shared/components/footer/footer.component';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [CommonModule, FormsModule, FooterComponent],
  template: `

    <div class="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-12" style="padding-top:calc(70px + 2rem)">
      <div class="max-w-3xl mx-auto px-4">
        <!-- Header -->
        <div class="text-center mb-10">
          <h1 class="text-4xl font-bold text-slate-800 mb-4">Trouver votre colocataire idéal</h1>
          <p class="text-lg text-slate-600">Répondez à ce questionnaire pour que notre IA trouve votre match parfait</p>
          
          <!-- Progress -->
          <div class="mt-6 flex justify-center items-center gap-2">
            <div *ngFor="let step of [1,2,3,4,5]" 
                 class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                 [class.bg-emerald-600]="currentStep() >= step"
                 [class.text-white]="currentStep() >= step"
                 [class.bg-slate-200]="currentStep() < step"
                 [class.text-slate-500]="currentStep() < step">
              {{ step }}
            </div>
          </div>
        </div>

        <!-- Form Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8">
          
          <!-- Étape 1: Informations académiques -->
          <div *ngIf="currentStep() === 1">
            <h2 class="text-2xl font-bold text-slate-800 mb-2">📚 Vos informations académiques</h2>
            <p class="text-sm text-slate-500 mb-6">Ces informations aident l'IA à trouver des profils compatibles avec votre parcours.</p>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  Université <span class="text-red-500 font-bold">*</span>
                </label>
                <input type="text" [(ngModel)]="questionnaire.universite" name="universite"
                       [class.border-red-400]="stepTouched && !questionnaire.universite"
                       class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                       placeholder="Ex: Université de Tunis, ESPRIT, INSAT...">
                <p *ngIf="stepTouched && !questionnaire.universite" class="text-xs text-red-500 mt-1">Ce champ est requis</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  Filière <span class="text-red-500 font-bold">*</span>
                </label>
                <input type="text" [(ngModel)]="questionnaire.filiere" name="filiere"
                       [class.border-red-400]="stepTouched && !questionnaire.filiere"
                       class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                       placeholder="Ex: Informatique, Médecine, Génie Civil...">
                <p *ngIf="stepTouched && !questionnaire.filiere" class="text-xs text-red-500 mt-1">Ce champ est requis</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Niveau d'études</label>
                <select [(ngModel)]="questionnaire.niveauEtude" name="niveauEtude"
                        class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500">
                  <option value="">Sélectionnez...</option>
                  <option value="LICENCE_1">Licence 1</option>
                  <option value="LICENCE_2">Licence 2</option>
                  <option value="LICENCE_3">Licence 3</option>
                  <option value="MASTER_1">Master 1</option>
                  <option value="MASTER_2">Master 2</option>
                  <option value="DOCTORAT">Doctorat</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Étape 2: À propos de vous -->
          <div *ngIf="currentStep() === 2">
            <h2 class="text-2xl font-bold text-slate-800 mb-2">👤 Présentez-vous</h2>

            <!-- Jina AI notice -->
            <div class="flex items-start gap-3 p-4 rounded-xl mb-6"
                 style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #6ee7b7">
              <span class="text-2xl flex-shrink-0">🤖</span>
              <div>
                <p class="font-bold text-emerald-800 text-sm">Analyse par Jina AI</p>
                <p class="text-emerald-700 text-xs mt-0.5">
                  Votre description est envoyée à <strong>Jina AI</strong> (embeddings multilingues) pour générer
                  votre vecteur de personnalité. Plus votre description est détaillée, plus les matches seront précis.
                </p>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  Décrivez-vous en quelques phrases <span class="text-red-500 font-bold">*</span>
                  <span class="ml-1 text-xs text-emerald-600 font-semibold">Utilisé par l'IA</span>
                </label>
                <textarea [(ngModel)]="questionnaire.descriptionPersonnelle" name="descriptionPersonnelle"
                          rows="5"
                          [class.border-red-400]="stepTouched && !questionnaire.descriptionPersonnelle"
                          class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Ex: Je suis un étudiant calme et organisé. J'aime le sport le matin et la lecture le soir. Je préfère un environnement propre et je reçois rarement des amis. Je cherche quelqu'un de discret et sérieux dans ses études..."></textarea>
                <div class="flex justify-between mt-1">
                  <p *ngIf="stepTouched && !questionnaire.descriptionPersonnelle" class="text-xs text-red-500">Ce champ est requis pour l'analyse IA</p>
                  <p class="text-xs text-slate-400 ml-auto">{{ (questionnaire.descriptionPersonnelle || '').length }} / 50 min</p>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  Vos hobbies <span class="text-red-500 font-bold">*</span>
                  <span class="ml-1 text-xs text-emerald-600 font-semibold">Utilisé par l'IA</span>
                </label>
                <input type="text" [(ngModel)]="hobbiesInput" name="hobbies"
                       [class.border-red-400]="stepTouched && !hobbiesInput"
                       class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                       placeholder="sport, lecture, musique, voyage, jeux vidéo, cuisine...">
                <p *ngIf="stepTouched && !hobbiesInput" class="text-xs text-red-500 mt-1">Entrez au moins un hobby</p>
                <p class="text-xs text-slate-400 mt-1">Séparés par des virgules</p>
              </div>
            </div>
          </div>

          <!-- Étape 3: Habitudes de vie -->
          <div *ngIf="currentStep() === 3">
            <h2 class="text-2xl font-bold text-slate-800 mb-2">🏠 Vos habitudes de vie</h2>
            <p class="text-sm text-slate-500 mb-6">Ces habitudes sont comparées avec celles des autres étudiants pour détecter la compatibilité.</p>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  Horaire type <span class="text-red-500 font-bold">*</span>
                </label>
                <div class="grid grid-cols-3 gap-3">
                  <label *ngFor="let h of ['matinal', 'nocturne', 'flexible']" 
                         class="cursor-pointer border-2 rounded-lg p-4 text-center transition-all"
                         [class.border-emerald-500]="questionnaire.horaireType === h"
                         [class.bg-emerald-50]="questionnaire.horaireType === h"
                         [class.border-slate-200]="questionnaire.horaireType !== h">
                    <input type="radio" [(ngModel)]="questionnaire.horaireType" name="horaireType" [value]="h" class="hidden">
                    <span class="text-2xl block mb-1">{{ h === 'matinal' ? '🌅' : h === 'nocturne' ? '🌙' : '🌓' }}</span>
                    <span class="text-sm font-medium capitalize">{{ h }}</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Niveau de propreté</label>
                <select [(ngModel)]="questionnaire.niveauProprete" name="niveauProprete"
                        class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500">
                  <option value="">Sélectionnez...</option>
                  <option value="tres_organise">Très organisé (tout doit être parfait)</option>
                  <option value="moyen">Moyen (quelques désordres tolérés)</option>
                  <option value="relaxe">Relax (le désordre ne me dérange pas)</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Fréquence d'invités</label>
                <select [(ngModel)]="questionnaire.frequenceInvites" name="frequenceInvites"
                        class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500">
                  <option value="">Sélectionnez...</option>
                  <option value="jamais">Jamais (je préfère la tranquillité)</option>
                  <option value="occasionnel">Occasionnel (de temps en temps)</option>
                  <option value="souvent">Souvent (j'aime avoir du monde)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Étape 4: Préférences -->
          <div *ngIf="currentStep() === 4">
            <h2 class="text-2xl font-bold text-slate-800 mb-6">⚡ Vos préférences</h2>
            
            <div class="space-y-6">
              <div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p class="font-medium text-slate-800">Vous fumez ?</p>
                  <p class="text-sm text-slate-500">Cigarettes, vape, etc.</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" [(ngModel)]="questionnaire.fumeur" name="fumeur" class="sr-only peer">
                  <div class="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              
              <div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p class="font-medium text-slate-800">Acceptez-vous un colocataire fumeur ?</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" [(ngModel)]="questionnaire.accepteFumeur" name="accepteFumeur" class="sr-only peer">
                  <div class="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              
              <div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p class="font-medium text-slate-800">Vous avez des animaux ?</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" [(ngModel)]="questionnaire.aAnimaux" name="aAnimaux" class="sr-only peer">
                  <div class="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              
              <div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p class="font-medium text-slate-800">Acceptez-vous des animaux chez votre colocataire ?</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" [(ngModel)]="questionnaire.accepteAnimaux" name="accepteAnimaux" class="sr-only peer">
                  <div class="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>

          <!-- Étape 5: Recherche -->
          <div *ngIf="currentStep() === 5">
            <h2 class="text-2xl font-bold text-slate-800 mb-2">🔍 Vos critères de recherche</h2>
            <p class="text-sm text-slate-500 mb-6">Ces critères sont utilisés pour filtrer les résultats (30% du score final).</p>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  Ville recherchée <span class="text-red-500 font-bold">*</span>
                </label>
                <input type="text" [(ngModel)]="questionnaire.villeRechercheColocation" name="villeRechercheColocation"
                       [class.border-red-400]="stepTouched && !questionnaire.villeRechercheColocation"
                       class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                       placeholder="Ex: Ariana, Tunis, Sfax...">
                <p *ngIf="stepTouched && !questionnaire.villeRechercheColocation" class="text-xs text-red-500 mt-1">Ce champ est requis</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  Budget max (TND/mois) <span class="text-red-500 font-bold">*</span>
                </label>
                <input type="number" [(ngModel)]="questionnaire.budgetMaxColocation" name="budgetMaxColocation"
                       [class.border-red-400]="stepTouched && !questionnaire.budgetMaxColocation"
                       class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                       placeholder="Ex: 400">
                <p *ngIf="stepTouched && !questionnaire.budgetMaxColocation" class="text-xs text-red-500 mt-1">Ce champ est requis</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Tranche d'âge préférée du colocataire</label>
                <div class="grid grid-cols-3 gap-3">
                  <label *ngFor="let age of ['18-22', '23-27', '28-35']" 
                         class="cursor-pointer border-2 rounded-lg p-3 text-center transition-all"
                         [class.border-emerald-500]="questionnaire.trancheAgeRecherche === age"
                         [class.bg-emerald-50]="questionnaire.trancheAgeRecherche === age"
                         [class.border-slate-200]="questionnaire.trancheAgeRecherche !== age">
                    <input type="radio" [(ngModel)]="questionnaire.trancheAgeRecherche" name="trancheAgeRecherche" [value]="age" class="hidden">
                    <span class="font-medium">{{ age }} ans</span>
                  </label>
                </div>
              </div>
              
              <div class="flex items-center p-4 bg-emerald-50 rounded-lg">
                <input type="checkbox" [(ngModel)]="questionnaire.memeUniversitePrefere" name="memeUniversitePrefere"
                       id="memeUniversite" class="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500">
                <label for="memeUniversite" class="ml-3 text-slate-700">
                  Je préfère quelqu'un de la <span class="font-semibold">même université</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex justify-between mt-8 pt-6 border-t border-slate-200">
            <button *ngIf="currentStep() > 1" (click)="prevStep()"
                    class="px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
              ← Précédent
            </button>
            <div *ngIf="currentStep() === 1"></div>
            
            <button *ngIf="currentStep() < 5" (click)="nextStep()"
                    class="px-6 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors">
              Suivant →
            </button>
            
            <button *ngIf="currentStep() === 5" (click)="submit()" [disabled]="isSubmitting()"
                    class="px-8 py-3 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <span *ngIf="isSubmitting()" class="animate-spin">⏳</span>
              {{ isSubmitting() ? 'Analyse par IA...' : 'Trouver mon colocataire 🤖' }}
            </button>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage()" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {{ errorMessage() }}
          </div>
        </div>
      </div>
    </div>
    
    <app-footer></app-footer>
  `
})
export class QuestionnaireComponent {
  private matchingService = inject(MatchingService);
  private router = inject(Router);

  currentStep  = signal(1);
  isSubmitting = signal(false);
  errorMessage = signal('');
  stepTouched  = false;

  questionnaire: QuestionnaireDTO = {};
  hobbiesInput = '';

  // ── Validation per step ──────────────────────────────────────────────────

  private validateStep(step: number): boolean {
    switch (step) {
      case 1:
        return !!(this.questionnaire.universite?.trim() && this.questionnaire.filiere?.trim());
      case 2:
        return !!(this.questionnaire.descriptionPersonnelle?.trim() &&
                  this.questionnaire.descriptionPersonnelle.trim().length >= 20 &&
                  this.hobbiesInput.trim());
      case 3:
        return !!(this.questionnaire.horaireType && this.questionnaire.niveauProprete);
      case 4:
        return true; // checkboxes always have a value
      case 5:
        return !!(this.questionnaire.villeRechercheColocation?.trim() &&
                  this.questionnaire.budgetMaxColocation &&
                  this.questionnaire.budgetMaxColocation > 0);
      default:
        return true;
    }
  }

  stepErrorMessage(step: number): string {
    switch (step) {
      case 1: return 'Veuillez renseigner votre université et votre filière.';
      case 2: return 'Rédigez une description d\'au moins 20 caractères et ajoutez vos hobbies — l\'IA en a besoin pour calculer votre score.';
      case 3: return 'Sélectionnez votre horaire et votre niveau de propreté.';
      case 5: return 'Renseignez la ville recherchée et votre budget maximum.';
      default: return '';
    }
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  nextStep() {
    this.stepTouched = true;
    if (!this.validateStep(this.currentStep())) {
      this.errorMessage.set(this.stepErrorMessage(this.currentStep()));
      return;
    }
    this.errorMessage.set('');
    this.stepTouched = false;
    if (this.currentStep() < 5) this.currentStep.update(s => s + 1);
  }

  prevStep() {
    this.errorMessage.set('');
    this.stepTouched = false;
    if (this.currentStep() > 1) this.currentStep.update(s => s - 1);
  }

  // ── Submit → Jina AI embedding → redirect ────────────────────────────────

  submit() {
    this.stepTouched = true;
    if (!this.validateStep(5)) {
      this.errorMessage.set(this.stepErrorMessage(5));
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.questionnaire.hobbies = this.hobbiesInput
      .split(',')
      .map(h => h.trim())
      .filter(h => h.length > 0);

    this.matchingService.sauvegarderQuestionnaire(this.questionnaire).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        if (response.success) {
          this.router.navigate(['/colocataires/matches']);
        } else {
          this.errorMessage.set('Erreur lors de la sauvegarde.');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.error?.message || err?.error?.erreur;
        this.errorMessage.set(msg || 'Erreur serveur. Veuillez réessayer.');
        console.error(err);
      }
    });
  }
}
