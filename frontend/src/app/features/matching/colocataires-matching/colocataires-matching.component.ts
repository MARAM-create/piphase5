import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  MatchingService,
  MatchColocataireDTO
} from '../../../core/services/matching.service';
import { FooterComponent } from '../../../shared/components/footer/footer.component';

type SortMode = 'compatibilite' | 'budget' | 'nom';

@Component({
  selector: 'app-colocataires-matching',
  standalone: true,
  imports: [CommonModule, FormsModule, FooterComponent],
  template: `
    <div class="min-h-screen bg-[#f6fbf8] text-[#12372a] overflow-x-hidden">

      <!-- HERO -->
      <!-- HERO -->
      <section class="relative overflow-hidden min-h-[176px] flex items-center">

        <!-- Image de fond -->
        <div
          class="absolute inset-0 bg-cover bg-center"
          style="background-image: url('assets/images/listing-hero.png');"
        ></div>

        <!-- Overlay vert comme Visites en ligne -->
        <div
          class="absolute inset-0"
          style="background:
      linear-gradient(
        90deg,
        rgba(3, 33, 23, 0.96) 0%,
        rgba(6, 69, 47, 0.90) 42%,
        rgba(6, 69, 47, 0.55) 100%
      );"
        ></div>

        <!-- Effet subtil -->
        <div
          class="absolute inset-0"
          style="background:
      radial-gradient(circle at 8% 10%, rgba(255,255,255,0.07), transparent 26%),
      linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.10));"
        ></div>

        <!-- Contenu -->
        <div class="relative z-10 w-full max-w-[1500px] mx-auto px-5 lg:px-8 py-7">
          <div class="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 lg:gap-8 items-center">

            <div class="min-w-0">
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d9a755]/45 bg-white/10 backdrop-blur text-[#f6d389] text-[11px] font-black tracking-[0.10em] uppercase">
                <span>💛</span>
                Propulsé par notre IA
              </div>

              <h1 class="mt-3 text-3xl md:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
                Vos colocataires compatibles
              </h1>

              <p class="mt-2 text-white/95 text-sm md:text-base leading-relaxed max-w-3xl drop-shadow-sm">
                Notre IA analyse votre personnalité, vos habitudes et vos préférences
                pour vous proposer des colocataires compatibles, de façon claire et rapide.
              </p>
            </div>

            <div class="flex lg:justify-end">
              <button
                type="button"
                (click)="refaireQuestionnaire()"
                class="h-12 px-6 rounded-2xl bg-[#f2c66d] hover:bg-[#eabf62] text-[#073d2a] font-black text-sm shadow-[0_12px_30px_rgba(242,198,109,0.22)] transition inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>⚙</span>
                Modifier mes préférences
              </button>
            </div>

          </div>
        </div>
      </section>

      <!-- LOADING -->
      <section *ngIf="isLoading()" class="max-w-[1500px] mx-auto px-5 lg:px-8 py-12">
        <div class="bg-white rounded-[28px] border border-[#dce9e2] shadow-[0_18px_55px_rgba(15,23,42,0.08)] p-10 flex flex-col items-center text-center">
          <div class="relative w-16 h-16">
            <div class="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
            <div class="absolute inset-0 rounded-full border-4 border-[#08734e] border-t-transparent animate-spin"></div>
            <span class="absolute inset-0 flex items-center justify-center text-xl">🤖</span>
          </div>
          <h2 class="mt-4 text-lg font-black text-[#12372a]">Analyse en cours...</h2>
          <p class="mt-1 text-sm text-slate-500">
            Notre IA compare les profils et calcule les compatibilités.
          </p>
        </div>
      </section>

      <!-- EMPTY QUESTIONNAIRE -->
      <section *ngIf="!isLoading() && !questionnaireComplete()" class="max-w-[1500px] mx-auto px-5 lg:px-8 py-12">
        <div class="bg-white rounded-[28px] border border-[#dce9e2] shadow-[0_18px_55px_rgba(15,23,42,0.08)] p-10 flex flex-col items-center text-center">
          <div class="w-20 h-20 rounded-full bg-[#e3f8ec] flex items-center justify-center text-4xl mb-5">
            📝
          </div>
          <h2 class="text-xl font-black text-[#12372a] mb-2">Questionnaire non rempli</h2>
          <p class="text-slate-500 text-sm max-w-md mb-6">
            Répondez au questionnaire pour que notre IA trouve votre colocataire idéal.
          </p>
          <button
            type="button"
            (click)="commencerQuestionnaire()"
            class="px-7 py-3 rounded-2xl bg-[#08734e] hover:bg-[#065f41] text-white text-sm font-black transition shadow-lg shadow-emerald-900/10"
          >
            Commencer le questionnaire →
          </button>
        </div>
      </section>

      <!-- EMPTY MATCHES -->
      <section *ngIf="!isLoading() && questionnaireComplete() && matches().length === 0" class="max-w-[1500px] mx-auto px-5 lg:px-8 py-12">
        <div class="bg-white rounded-[28px] border border-[#dce9e2] shadow-[0_18px_55px_rgba(15,23,42,0.08)] p-10 flex flex-col items-center text-center">
          <div class="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-4xl mb-5">
            🔍
          </div>
          <h2 class="text-xl font-black text-[#12372a] mb-2">Aucun match pour l’instant</h2>
          <p class="text-slate-500 text-sm max-w-md mb-6">
            D’autres étudiants pourront vous trouver une fois qu’ils remplissent leur questionnaire.
          </p>
          <button
            type="button"
            (click)="refaireQuestionnaire()"
            class="px-6 py-3 rounded-2xl border border-[#08734e] text-[#08734e] hover:bg-[#ecfdf5] text-sm font-black transition"
          >
            Modifier mes critères
          </button>
        </div>
      </section>

      <!-- MATCHES CONTENT -->
      <main *ngIf="!isLoading() && matches().length > 0" class="max-w-[1500px] mx-auto px-5 lg:px-8 py-4 lg:py-5">

        <!-- TOOLBAR -->
        <section class="mb-4">
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-3 items-center">

            <!-- Count -->
            <div class="xl:col-span-2 bg-white rounded-2xl border border-[#dce9e2] shadow-sm h-14 px-4 flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-[#dff8e9] text-[#08734e] flex items-center justify-center text-base shrink-0">
                ♙
              </div>
              <div class="min-w-0">
                <p class="text-xl leading-none font-black text-[#06452f]">
                  {{ filteredMatches().length }}
                </p>
                <p class="text-[11px] text-slate-500 font-semibold leading-tight">
                  profil{{ filteredMatches().length > 1 ? 's' : '' }} compatible{{ filteredMatches().length > 1 ? 's' : '' }}
                </p>
              </div>
            </div>

            <!-- Sort -->
            <div class="xl:col-span-2 relative">
              <select
                [ngModel]="sortMode()"
                (ngModelChange)="setSortMode($event)"
                class="w-full h-14 rounded-2xl border border-[#dce9e2] bg-white px-4 pr-9 text-sm font-bold text-[#12372a] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f2c66d] appearance-none"
              >
                <option value="compatibilite">Trier par compatibilité</option>
                <option value="budget">Trier par budget</option>
                <option value="nom">Trier par nom</option>
              </select>
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">⌄</span>
            </div>

            <!-- Search -->
            <div class="xl:col-span-4 relative">
              <input
                type="text"
                [ngModel]="searchTerm()"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Rechercher un profil, une école, une ville..."
                class="w-full h-14 rounded-2xl border border-[#dce9e2] bg-white px-4 pr-12 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f2c66d]"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[#08734e] text-lg">⌕</span>
            </div>

            <!-- Same city -->
            <button
              type="button"
              (click)="toggleSameCityOnly()"
              [ngClass]="sameCityOnly()
                ? 'bg-[#08734e] text-white border-[#08734e]'
                : 'bg-white text-[#12372a] border-[#dce9e2]'"
              class="xl:col-span-1 h-14 rounded-2xl border px-4 text-sm font-black shadow-sm hover:shadow-md transition flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>⌖</span>
              Même ville
            </button>

            <!-- Budget -->
            <div class="xl:col-span-2 relative">
              <select
                [ngModel]="budgetCap()"
                (ngModelChange)="setBudgetCap($event)"
                class="w-full h-14 rounded-2xl border border-[#dce9e2] bg-white px-4 pr-9 text-sm font-bold text-[#12372a] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f2c66d] appearance-none"
              >
                <option [ngValue]="null">Budget max</option>
                <option [ngValue]="400">≤ 400 TND</option>
                <option [ngValue]="500">≤ 500 TND</option>
                <option [ngValue]="600">≤ 600 TND</option>
                <option [ngValue]="800">≤ 800 TND</option>
              </select>
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">⌄</span>
            </div>

            <!-- Reset -->
            <button
              type="button"
              (click)="resetFilters()"
              class="xl:col-span-1 h-14 rounded-2xl border border-[#dce9e2] bg-white text-[#12372a] px-4 text-sm font-black shadow-sm hover:bg-[#f8faf9] transition flex items-center justify-center gap-2 whitespace-nowrap"
            >
              ☰
              Reset
            </button>
          </div>

          <p class="mt-3 text-xs md:text-sm text-slate-500 leading-relaxed">
            ✨ Triés par compatibilité IA · score calculé sur personnalité, habitudes et critères de logement.
          </p>
        </section>

        <!-- NO RESULTS AFTER FILTER -->
        <section *ngIf="filteredMatches().length === 0" class="bg-white rounded-[24px] border border-[#dce9e2] shadow-sm p-10 text-center">
          <h2 class="text-lg font-black text-[#12372a]">Aucun résultat avec ces filtres</h2>
          <p class="mt-2 text-sm text-slate-500">
            Essayez de modifier la recherche ou de réinitialiser les filtres.
          </p>
          <button
            type="button"
            (click)="resetFilters()"
            class="mt-5 px-6 py-3 rounded-2xl bg-[#08734e] text-white text-sm font-black hover:bg-[#065f41] transition"
          >
            Réinitialiser
          </button>
        </section>

        <!-- MAIN LAYOUT -->
        <section *ngIf="filteredMatches().length > 0" class="grid grid-cols-1 xl:grid-cols-12 gap-5">

          <!-- TOP MATCH -->
          <aside class="xl:col-span-5">
            <article *ngIf="topMatch() as top" class="relative bg-white rounded-[24px] border-2 border-[#075f42] shadow-[0_20px_55px_rgba(6,69,47,0.10)] overflow-hidden">

              <div class="absolute top-0 left-0 h-11 px-5 rounded-br-2xl bg-[#06452f] text-white flex items-center gap-2 text-sm font-black z-10">
                <span class="text-[#f2c66d]">♛</span>
                TOP MATCH
              </div>

              <div class="p-5 pt-12">
                <div class="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5">

                  <!-- Photo -->
                  <div>
                    <div class="relative h-[240px] rounded-3xl overflow-hidden bg-[#dfeee6]">
                      <img
                        *ngIf="top.photoProfil"
                        [src]="top.photoProfil"
                        [alt]="top.prenom + ' ' + top.nom"
                        class="w-full h-full object-cover"
                      />

                      <div
                        *ngIf="!top.photoProfil"
                        class="w-full h-full flex items-center justify-center text-white text-4xl font-black"
                        [style.background]="avatarBg(top.scoreCompatibilite)"
                      >
                        {{ initiales(top.prenom, top.nom) }}
                      </div>

                      <div class="absolute left-3 bottom-3 w-24 h-24 rounded-full bg-white p-2 shadow-xl">
                        <div
                          class="w-full h-full rounded-full p-[6px]"
                          [style.background]="compatibilityRing(top.scoreCompatibilite)"
                        >
                          <div class="w-full h-full rounded-full bg-white flex flex-col items-center justify-center">
                            <p class="text-2xl font-black" [style.color]="scoreColor(top.scoreCompatibilite)">
                              {{ top.scoreCompatibilite }}%
                            </p>
                            <p class="text-[9px] font-bold text-[#12372a] leading-none">Compatibilité</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Details -->
                  <div class="flex flex-col min-w-0">
                    <div>
                      <div class="flex items-center gap-2 min-w-0">
                        <h2 class="text-xl lg:text-2xl font-black text-[#12372a] truncate">
                          {{ top.prenom }} {{ top.nom }}
                        </h2>
                        <span class="w-5 h-5 rounded-full bg-[#08734e] text-white flex items-center justify-center text-[10px] shrink-0">✓</span>
                      </div>

                      <p class="mt-2 text-sm font-semibold text-slate-600 leading-relaxed">
                        <span *ngIf="top.age">{{ top.age }} ans</span>
                        <span *ngIf="top.age && top.universite"> · </span>
                        <span *ngIf="top.universite">{{ top.universite }}</span>
                      </p>

                      <p class="mt-1 text-sm text-slate-500 flex items-center gap-2">
                        <span>⌖</span>
                        {{ top.villeRecherche || 'Ville non précisée' }}
                      </p>

                      <p class="mt-4 text-sm leading-relaxed text-slate-600 italic line-clamp-3">
                        “{{ descriptionCourte(top) }}”
                      </p>
                    </div>

                    <div class="mt-4 pt-4 border-t border-[#e4eee8]">
                      <h3 class="text-sm font-black text-[#12372a] mb-3">
                        Pourquoi ce match ?
                      </h3>

                      <div class="space-y-2">
                        <p
                          *ngFor="let reason of matchReasons(top).slice(0, 4)"
                          class="text-sm text-[#075f42] flex items-start gap-2 leading-snug"
                        >
                          <span class="font-black shrink-0">✓</span>
                          <span>{{ reason }}</span>
                        </p>
                      </div>
                    </div>

                    <div class="mt-4 grid grid-cols-2 rounded-2xl border border-[#dce9e2] overflow-hidden">
                      <div class="p-3 border-r border-[#dce9e2]">
                        <p class="text-[11px] text-slate-500 font-bold">Budget</p>
                        <p class="mt-1 font-black text-[#12372a] text-sm leading-snug">
                          {{ top.budgetMax ? (top.budgetMax + ' TND / mois') : 'Non précisé' }}
                        </p>
                      </div>

                      <div class="p-3">
                        <p class="text-[11px] text-slate-500 font-bold">Profil</p>
                        <p class="mt-1 font-black text-[#12372a] text-sm leading-snug">
                          {{ top.filiere || 'Étudiant' }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                  <button
                    type="button"
                    (click)="ouvrirContact(top)"
                    class="h-12 rounded-2xl bg-[#08734e] hover:bg-[#065f41] text-white text-sm font-black shadow-lg shadow-emerald-900/10 transition flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    💬 Contacter {{ top.prenom }}
                  </button>

                  <button
                    type="button"
                    (click)="ouvrirProfil(top)"
                    class="h-12 rounded-2xl border border-[#08734e] text-[#08734e] hover:bg-[#ecfdf5] text-sm font-black transition flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    ♙ Voir le profil
                  </button>
                </div>
              </div>
            </article>
          </aside>

          <!-- RIGHT LIST -->
          <section class="xl:col-span-7">
            <div class="space-y-3">

              <article
                *ngFor="let match of visibleRightMatches()"
                class="bg-white rounded-[22px] border border-[#dce9e2] shadow-[0_12px_35px_rgba(15,23,42,0.05)] hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition overflow-hidden"
              >
                <div class="p-4 grid grid-cols-1 lg:grid-cols-[250px_1fr_105px_115px] gap-4 items-center">

                  <!-- Identity -->
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="relative shrink-0">
                      <div
                        class="w-16 h-16 rounded-full overflow-hidden bg-[#dfeee6] border-4 border-white shadow-md flex items-center justify-center text-white text-lg font-black"
                        [style.background]="!match.photoProfil ? avatarBg(match.scoreCompatibilite) : ''"
                      >
                        <img
                          *ngIf="match.photoProfil"
                          [src]="match.photoProfil"
                          [alt]="match.prenom + ' ' + match.nom"
                          class="w-full h-full object-cover"
                        />
                        <span *ngIf="!match.photoProfil">{{ initiales(match.prenom, match.nom) }}</span>
                      </div>

                      <span class="absolute right-0.5 bottom-0.5 w-3.5 h-3.5 rounded-full bg-[#08734e] border-2 border-white"></span>
                    </div>

                    <div class="min-w-0">
                      <h3 class="text-base font-black text-[#12372a] truncate">
                        {{ match.prenom }} {{ match.nom }}
                      </h3>

                      <p class="text-xs text-slate-500 font-semibold truncate mt-1">
                        <span *ngIf="match.age">{{ match.age }} ans</span>
                        <span *ngIf="match.age && match.universite"> · </span>
                        <span *ngIf="match.universite">{{ match.universite }}</span>
                      </p>

                      <p class="text-xs text-slate-500 mt-1.5 flex items-center gap-1 truncate">
                        <span>⌖</span>
                        {{ match.villeRecherche || 'Ville non précisée' }}
                      </p>
                    </div>
                  </div>

                  <!-- Tags -->
                  <div class="min-w-0">
                    <div class="flex flex-wrap gap-2">
                      <span
                        *ngFor="let pt of matchReasons(match).slice(0, 2)"
                        class="px-3 py-1 rounded-full bg-[#dff8e9] text-[#075f42] text-xs font-black leading-tight"
                      >
                        {{ pt }}
                      </span>
                    </div>

                    <div *ngIf="match.hobbies?.length" class="flex flex-wrap gap-2 mt-2">
                      <span
                        *ngFor="let h of match.hobbies!.slice(0, 2)"
                        class="px-3 py-1 rounded-full bg-[#f8fafc] border border-slate-200 text-slate-600 text-xs font-semibold capitalize leading-tight"
                      >
                        {{ h }}
                      </span>
                    </div>
                  </div>

                  <!-- Score -->
                  <div class="flex lg:justify-center">
                    <div class="text-center">
                      <div
                        class="w-16 h-16 rounded-full p-[5px] mx-auto"
                        [style.background]="compatibilityRing(match.scoreCompatibilite)"
                      >
                        <div class="w-full h-full rounded-full bg-white flex items-center justify-center">
                          <p class="text-lg font-black" [style.color]="scoreColor(match.scoreCompatibilite)">
                            {{ match.scoreCompatibilite }}%
                          </p>
                        </div>
                      </div>
                      <p class="mt-1 text-[11px] font-bold text-[#12372a] whitespace-nowrap">Compatibilité</p>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex flex-row lg:flex-col gap-2">
                    <button
                      type="button"
                      (click)="ouvrirProfil(match)"
                      class="flex-1 h-10 rounded-xl border border-[#08734e] text-[#08734e] hover:bg-[#ecfdf5] text-xs font-black transition whitespace-nowrap"
                    >
                      Voir profil
                    </button>

                    <button
                      type="button"
                      (click)="ouvrirContact(match)"
                      class="flex-1 h-10 rounded-xl bg-[#08734e] hover:bg-[#065f41] text-white text-xs font-black transition whitespace-nowrap"
                    >
                      Contacter
                    </button>
                  </div>
                </div>
              </article>

              <button
                *ngIf="hasMoreRightMatches()"
                type="button"
                (click)="loadMore()"
                class="w-full h-12 rounded-2xl bg-white border border-[#dce9e2] text-[#12372a] text-sm font-black hover:bg-[#f8faf9] transition shadow-sm flex items-center justify-center gap-2"
              >
                ⟳ Charger plus de profils
              </button>

            </div>
          </section>
        </section>
      </main>
    </div>

    <!-- MODAL PROFIL -->
    <div
      *ngIf="profilOuvert() && profilSelectionne() as profil"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
      (click)="fermerProfil()"
    >
      <div
        class="bg-white rounded-[28px] w-full max-w-xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.28)]"
        style="max-height:90vh"
        (click)="$event.stopPropagation()"
      >
        <div class="relative h-36" [style.background]="scoreGradient(profil.scoreCompatibilite)">
          <button
            type="button"
            (click)="fermerProfil()"
            class="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 hover:bg-black/35 text-white text-xl font-black transition"
          >
            ×
          </button>

          <div class="absolute -bottom-12 left-7">
            <div
              class="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-xl flex items-center justify-center text-white text-2xl font-black"
              [style.background]="!profil.photoProfil ? avatarBg(profil.scoreCompatibilite) : ''"
            >
              <img
                *ngIf="profil.photoProfil"
                [src]="profil.photoProfil"
                [alt]="profil.prenom + ' ' + profil.nom"
                class="w-full h-full object-cover"
              />
              <span *ngIf="!profil.photoProfil">{{ initiales(profil.prenom, profil.nom) }}</span>
            </div>
          </div>

          <div class="absolute bottom-4 right-6 px-4 py-2 rounded-full bg-white/20 backdrop-blur text-white text-sm font-black">
            {{ profil.scoreCompatibilite }}% compatible
          </div>
        </div>

        <div class="overflow-y-auto px-7 pt-16 pb-7" style="max-height:calc(90vh - 144px)">
          <h2 class="text-2xl font-black text-[#12372a]">
            {{ profil.prenom }} {{ profil.nom }}
          </h2>

          <p class="mt-1 text-sm text-slate-500 font-semibold">
            <span *ngIf="profil.age">{{ profil.age }} ans</span>
            <span *ngIf="profil.age && profil.universite"> · </span>
            <span *ngIf="profil.universite">{{ profil.universite }}</span>
          </p>

          <div class="mt-5 p-5 rounded-2xl bg-[#f8faf9] border-l-4 border-[#08734e]">
            <p class="text-sm text-slate-600 italic leading-relaxed">
              “{{ descriptionCourte(profil) }}”
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            <div class="rounded-2xl bg-[#ecfdf5] p-4">
              <p class="text-xs text-slate-500 font-bold">Filière</p>
              <p class="mt-1 text-sm font-black text-[#12372a]">{{ profil.filiere || 'Non précisée' }}</p>
            </div>

            <div class="rounded-2xl bg-[#ecfdf5] p-4">
              <p class="text-xs text-slate-500 font-bold">Ville</p>
              <p class="mt-1 text-sm font-black text-[#12372a]">{{ profil.villeRecherche || 'Non précisée' }}</p>
            </div>

            <div class="rounded-2xl bg-[#ecfdf5] p-4">
              <p class="text-xs text-slate-500 font-bold">Budget max</p>
              <p class="mt-1 text-sm font-black text-[#12372a]">
                {{ profil.budgetMax ? (profil.budgetMax + ' TND') : 'Non précisé' }}
              </p>
            </div>
          </div>

          <div *ngIf="matchReasons(profil).length" class="mt-6">
            <p class="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Points communs</p>
            <div class="flex flex-wrap gap-2">
              <span
                *ngFor="let pt of matchReasons(profil)"
                class="px-3 py-1.5 rounded-full bg-[#dff8e9] text-[#075f42] text-xs font-black"
              >
                ✓ {{ pt }}
              </span>
            </div>
          </div>

          <div *ngIf="profil.hobbies?.length" class="mt-6">
            <p class="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Hobbies</p>
            <div class="flex flex-wrap gap-2">
              <span
                *ngFor="let h of profil.hobbies"
                class="px-3 py-1.5 rounded-full bg-[#f8fafc] border border-slate-200 text-slate-600 text-xs font-semibold capitalize"
              >
                {{ h }}
              </span>
            </div>
          </div>

          <button
            type="button"
            (click)="ouvrirContactDepuisProfil()"
            class="w-full mt-7 h-12 rounded-2xl bg-[#08734e] hover:bg-[#065f41] text-white text-sm font-black transition"
          >
            💬 Envoyer un message
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL CONTACT -->
    <div
      *ngIf="contactOuvert() && contactSelectionne() as contact"
      class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
      (click)="fermerContact()"
    >
      <div
        class="bg-white rounded-[28px] w-full max-w-md overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.28)]"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
          <div
            class="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-white font-black shrink-0"
            [style.background]="!contact.photoProfil ? avatarBg(contact.scoreCompatibilite) : ''"
          >
            <img
              *ngIf="contact.photoProfil"
              [src]="contact.photoProfil"
              [alt]="contact.prenom + ' ' + contact.nom"
              class="w-full h-full object-cover"
            />
            <span *ngIf="!contact.photoProfil">{{ initiales(contact.prenom, contact.nom) }}</span>
          </div>

          <div class="flex-1 min-w-0">
            <p class="font-black text-[#12372a] truncate">
              {{ contact.prenom }} {{ contact.nom }}
            </p>
            <p class="text-xs text-slate-500 font-semibold">
              {{ contact.scoreCompatibilite }}% de compatibilité
            </p>
          </div>

          <button
            type="button"
            (click)="fermerContact()"
            class="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 text-xl font-black transition"
          >
            ×
          </button>
        </div>

        <div class="px-6 py-6">

          <div *ngIf="contactSucces()" class="text-center py-7">
            <div class="w-16 h-16 rounded-full bg-[#dff8e9] text-[#08734e] flex items-center justify-center text-3xl mx-auto mb-4">
              ✓
            </div>

            <h3 class="text-xl font-black text-[#12372a]">Message envoyé !</h3>
            <p class="text-slate-500 text-sm mt-2">
              {{ contact.prenom }} recevra votre message par email.
            </p>

            <button
              type="button"
              (click)="fermerContact()"
              class="mt-6 px-8 py-3 rounded-2xl bg-[#08734e] text-white font-black hover:bg-[#065f41] transition"
            >
              Fermer
            </button>
          </div>

          <div *ngIf="!contactSucces()">
            <p class="text-slate-500 text-sm mb-4 leading-relaxed">
              Présentez-vous. Votre message sera envoyé à
              <strong class="text-[#12372a]">{{ contact.prenom }}</strong>.
            </p>

            <textarea
              [(ngModel)]="contactMessage"
              rows="5"
              placeholder="Bonjour ! Je m’appelle... J’ai vu que nous avons beaucoup en commun..."
              class="w-full text-sm px-4 py-3 rounded-2xl border-2 resize-none outline-none transition leading-relaxed"
              [ngClass]="contactErreur()
                ? 'border-red-300 focus:border-red-400'
                : 'border-slate-200 focus:border-[#08734e]'"
            ></textarea>

            <p *ngIf="contactErreur()" class="text-red-500 text-xs mt-2 font-semibold">
              ⚠️ {{ contactErreur() }}
            </p>

            <div class="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                (click)="fermerContact()"
                class="h-12 rounded-2xl border border-slate-200 text-slate-600 font-black hover:bg-slate-50 transition"
              >
                Annuler
              </button>

              <button
                type="button"
                (click)="envoyerContact()"
                [disabled]="contactEnvoi()"
                class="h-12 rounded-2xl bg-[#08734e] hover:bg-[#065f41] text-white font-black transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {{ contactEnvoi() ? 'Envoi...' : 'Envoyer' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <app-footer></app-footer>
  `,
  styles: [`
    :host {
      display: block;
    }

    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    select {
      cursor: pointer;
    }
  `]
})
export class ColocatairesMatchingComponent implements OnInit, OnDestroy {
  private matchingService = inject(MatchingService);
  private router = inject(Router);

  isLoading = signal(true);
  questionnaireComplete = signal(false);
  matches = signal<MatchColocataireDTO[]>([]);

  searchTerm = signal('');
  sortMode = signal<SortMode>('compatibilite');
  sameCityOnly = signal(false);
  budgetCap = signal<number | null>(null);
  visibleLimit = signal(4);

  profilOuvert = signal(false);
  profilSelectionne = signal<MatchColocataireDTO | null>(null);

  contactOuvert = signal(false);
  contactSelectionne = signal<MatchColocataireDTO | null>(null);
  contactMessage = '';
  contactEnvoi = signal(false);
  contactSucces = signal(false);
  contactErreur = signal<string | null>(null);

  filteredMatches = computed(() => {
    const search = this.normalize(this.searchTerm().trim());
    const budget = this.budgetCap();
    const sameCity = this.sameCityOnly();

    let result = this.matches().filter(match => {
      const searchable = this.normalize([
        match.prenom,
        match.nom,
        match.universite,
        match.filiere,
        match.villeRecherche,
        match.descriptionPersonnelle,
        ...(match.hobbies ?? []),
        ...(match.pointsCommuns ?? [])
      ].filter(Boolean).join(' '));

      const matchesSearch = !search || searchable.includes(search);

      const matchesBudget =
        budget === null ||
        !match.budgetMax ||
        match.budgetMax <= budget;

      const matchesSameCity =
        !sameCity ||
        this.matchReasons(match).some(reason =>
          this.normalize(reason).includes('ville')
        );

      return matchesSearch && matchesBudget && matchesSameCity;
    });

    result = [...result].sort((a, b) => {
      if (this.sortMode() === 'budget') {
        return (a.budgetMax ?? 999999) - (b.budgetMax ?? 999999);
      }

      if (this.sortMode() === 'nom') {
        const nameA = `${a.prenom ?? ''} ${a.nom ?? ''}`.trim();
        const nameB = `${b.prenom ?? ''} ${b.nom ?? ''}`.trim();
        return nameA.localeCompare(nameB);
      }

      return (b.scoreCompatibilite ?? 0) - (a.scoreCompatibilite ?? 0);
    });

    return result;
  });

  topMatch = computed(() => this.filteredMatches()[0] ?? null);

  rightMatches = computed(() => {
    const top = this.topMatch();
    if (!top) return [];
    return this.filteredMatches().filter(match => match !== top);
  });

  visibleRightMatches = computed(() =>
    this.rightMatches().slice(0, this.visibleLimit())
  );

  hasMoreRightMatches = computed(() =>
    this.visibleLimit() < this.rightMatches().length
  );

  ngOnInit(): void {
    this.verifierEtCharger();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  verifierEtCharger(): void {
    this.isLoading.set(true);

    this.matchingService.verifierStatut().subscribe({
      next: (statut) => {
        this.questionnaireComplete.set(statut.questionnaireComplete);

        if (statut.questionnaireComplete) {
          this.chargerMatches();
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  chargerMatches(): void {
    this.matchingService.trouverMatches(20).subscribe({
      next: (response) => {
        this.matches.set(response.matches ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  commencerQuestionnaire(): void {
    this.router.navigate(['/colocataires/questionnaire']);
  }

  refaireQuestionnaire(): void {
    this.router.navigate(['/colocataires/questionnaire']);
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.visibleLimit.set(4);
  }

  setSortMode(value: string): void {
    if (value === 'budget' || value === 'nom' || value === 'compatibilite') {
      this.sortMode.set(value);
      this.visibleLimit.set(4);
    }
  }

  setBudgetCap(value: number | null): void {
    this.budgetCap.set(value);
    this.visibleLimit.set(4);
  }

  toggleSameCityOnly(): void {
    this.sameCityOnly.set(!this.sameCityOnly());
    this.visibleLimit.set(4);
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.sortMode.set('compatibilite');
    this.sameCityOnly.set(false);
    this.budgetCap.set(null);
    this.visibleLimit.set(4);
  }

  loadMore(): void {
    this.visibleLimit.set(this.visibleLimit() + 4);
  }

  ouvrirProfil(match: MatchColocataireDTO): void {
    this.profilSelectionne.set(match);
    this.profilOuvert.set(true);
    document.body.style.overflow = 'hidden';
  }

  fermerProfil(): void {
    this.profilOuvert.set(false);
    this.profilSelectionne.set(null);

    if (!this.contactOuvert()) {
      document.body.style.overflow = '';
    }
  }

  ouvrirContact(match: MatchColocataireDTO): void {
    this.contactSelectionne.set(match);
    this.contactMessage = '';
    this.contactEnvoi.set(false);
    this.contactSucces.set(false);
    this.contactErreur.set(null);
    this.contactOuvert.set(true);
    document.body.style.overflow = 'hidden';
  }

  ouvrirContactDepuisProfil(): void {
    const profil = this.profilSelectionne();
    if (!profil) return;

    this.profilOuvert.set(false);
    this.profilSelectionne.set(null);
    this.ouvrirContact(profil);
  }

  fermerContact(): void {
    this.contactOuvert.set(false);
    this.contactSelectionne.set(null);
    this.contactMessage = '';
    this.contactEnvoi.set(false);
    this.contactSucces.set(false);
    this.contactErreur.set(null);

    if (!this.profilOuvert()) {
      document.body.style.overflow = '';
    }
  }

  envoyerContact(): void {
    const contact = this.contactSelectionne();

    if (!contact) {
      this.contactErreur.set('Aucun profil sélectionné.');
      return;
    }

    if (!this.contactMessage.trim()) {
      this.contactErreur.set('Veuillez écrire un message avant d’envoyer.');
      return;
    }

    this.contactErreur.set(null);
    this.contactEnvoi.set(true);

    this.matchingService
      .contacter(contact.utilisateurId, this.contactMessage.trim())
      .subscribe({
        next: () => {
          this.contactEnvoi.set(false);
          this.contactSucces.set(true);
        },
        error: (err) => {
          this.contactEnvoi.set(false);
          this.contactErreur.set(
            err?.error?.message || 'Erreur lors de l’envoi. Réessayez.'
          );
        }
      });
  }

  initiales(prenom?: string, nom?: string): string {
    const p = prenom?.trim()?.[0] ?? '';
    const n = nom?.trim()?.[0] ?? '';
    return `${p}${n}`.toUpperCase() || '?';
  }

  descriptionCourte(match: MatchColocataireDTO): string {
    return (
      match.descriptionPersonnelle ||
      'Profil compatible avec vos critères de colocation et vos préférences de vie.'
    );
  }

  matchReasons(match: MatchColocataireDTO): string[] {
    if (match.pointsCommuns?.length) {
      return match.pointsCommuns;
    }

    const fallback: string[] = [];

    if (match.villeRecherche) fallback.push('Même ville recherchée');
    if (match.hobbies?.length) fallback.push('Hobbies compatibles');
    if (match.budgetMax) fallback.push('Budget cohérent');

    return fallback.length ? fallback : ['Profil compatible avec vos préférences'];
  }

  scoreGradient(score: number): string {
    if (score >= 85) {
      return 'linear-gradient(135deg,#06452f 0%,#08734e 55%,#16a36d 100%)';
    }

    if (score >= 70) {
      return 'linear-gradient(135deg,#075f42 0%,#0f766e 100%)';
    }

    return 'linear-gradient(135deg,#334155 0%,#64748b 100%)';
  }

  scoreColor(score: number): string {
    if (score >= 85) return '#047857';
    if (score >= 70) return '#0f766e';
    return '#64748b';
  }

  avatarBg(score: number): string {
    if (score >= 85) {
      return 'linear-gradient(135deg,#06452f,#16a36d)';
    }

    if (score >= 70) {
      return 'linear-gradient(135deg,#075f42,#0f766e)';
    }

    return 'linear-gradient(135deg,#475569,#94a3b8)';
  }

  compatibilityRing(score: number): string {
    const safeScore = Math.max(0, Math.min(100, score || 0));
    const color = this.scoreColor(safeScore);
    return 'conic-gradient(' + color + ' ' + (safeScore * 3.6) + 'deg, #e5e7eb 0deg)';  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
