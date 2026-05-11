import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { HttpClient }        from '@angular/common/http';
import { RouterModule, ActivatedRoute }      from '@angular/router';
import { AuthService }       from '../../../../core/services/auth.service';
import { AnnonceService }    from '../../../../core/services/annonce.service';
import { AvisService }       from '../../../../core/services/avis.service';
import { ReclamationService } from '../../../../core/services/reclamation.service';
import { AnnonceLocationDTO } from '../../../../core/models/annonce';
import { AvisStats } from '../../../../core/models/avis.model';
import { ReclamationStats } from '../../../../core/models/reclamation.model';
import {
  Utilisateur, StatistiquesAdmin,
  LIBELLES_ROLE, LIBELLES_STATUT
} from '../../../../core/models/utilisateur.model';
import { environment }       from '../../../../../environments/environment';
import { AnnonceCardComponent } from '../../../yassine/annonces/components/annonce-card/annonce-card.component';
import { ReclamationListComponent } from '../../../reclamation/reclamation-list/reclamation-list.component';
import { AvisListComponent } from '../../../reclamation/avis-list/avis-list.component';
import { DemandeServiceService } from '../../../../core/services/demande-service.service';
import { DemandeServiceResponse } from '../../../../core/models/demande-service.model';

@Component({
  selector:   'app-admin',
  standalone: true,
  imports:    [CommonModule, FormsModule, RouterModule, AnnonceCardComponent, ReclamationListComponent, AvisListComponent],
  template: `

    <!-- ══ CONTENU SEULEMENT (sidebar fournie par AdminShellComponent) ══ -->
    <div class="flex-1 flex flex-col min-w-0">

      <!-- Header -->
      <header class="bg-white border-b px-8 py-4 flex items-center
                   justify-between sticky top-0 z-30"
              style="border-color:rgba(168,200,180,0.3)">
        <div>
          <h1 class="text-lg font-black" style="color:var(--forest);font-family:var(--font-heading)">
            {{titres[onglet]}}
          </h1>
          <p class="text-xs" style="color:var(--stone)">
            Locavia Admin · {{aujourdhui}}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Cloche notification -->
          <button class="relative w-10 h-10 bg-gray-100 rounded-xl
                       flex items-center justify-center hover:bg-gray-200
                       transition">
            🔔
            <span *ngIf="stats?.enAttente || alertesCount > 0"
                  class="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full
                   text-white text-xs flex items-center justify-center
                   font-black">
            {{ (stats?.enAttente || 0) + alertesCount }}
          </span>
          </button>
          <button (click)="chargerDonnees()"
                  class="flex items-center gap-2 text-sm transition font-medium px-4 py-2
                 rounded-xl border"
                  style="color:var(--stone);border-color:var(--sage);background:var(--white)"
                  onmouseover="this.style.color='var(--forest)';this.style.background='var(--mint)'"
                  onmouseout="this.style.color='var(--stone)';this.style.background='var(--white)'">
            🔄 Actualiser
          </button>
        </div>
      </header>

      <main class="flex-1 p-8 overflow-y-auto">

        <!-- ══ APERÇU ════════════════════════════════════════ -->
        <div *ngIf="onglet === 'apercu'" class="space-y-6">

          <!-- KPI Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div *ngFor="let c of cartesStat"
                 class="stat-card p-5 cursor-pointer"
                 [class.ring-2]="onglet === c.lien"
                 [style.--ring-color]="c.couleur"
                 (click)="c.lien && (onglet = c.lien)"
                 style="background:var(--white);border-radius:var(--radius-lg);border:1px solid rgba(168,200,180,0.4);box-shadow:var(--shadow);transition:all 0.22s"
                 onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='var(--shadow-lg)'"
                 onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='var(--shadow)'">
              <div class="flex items-center justify-between mb-3">
                <div class="w-10 h-10 rounded-xl flex items-center
                          justify-center text-xl"
                     [style.background]="c.couleur + '22'">
                  {{c.icone}}
                </div>
                <span class="text-xs font-bold px-2.5 py-1 rounded-full"
                      [style.background]="c.couleur + '22'"
                      [style.color]="c.couleur">
                Live
              </span>
              </div>
              <p class="text-3xl font-black" style="color:var(--forest);font-family:var(--font-heading)">
                {{stats ? stats[c.cle] : '—'}}
              </p>
              <p class="text-sm mt-1" style="color:var(--stone)">{{c.libelle}}</p>
            </div>
          </div>

          <!-- Ligne 2 : Activité récente + Répartition rôles -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- Activité récente (2/3) -->
            <div class="lg:col-span-2 card-locavia overflow-hidden">
              <div class="px-6 py-4 border-b flex items-center justify-between"
                   style="border-color:rgba(168,200,180,0.3)">
                <h3 class="font-black" style="color:var(--forest);font-family:var(--font-heading)">
                  Activité récente
                </h3>
                <button (click)="onglet = 'utilisateurs'"
                        class="text-xs font-semibold hover:underline"
                        style="color:var(--green)">
                  Voir tout →
                </button>
              </div>
              <div class="divide-y divide-gray-50">
                <div *ngFor="let u of activiteRecente"
                     class="flex items-center gap-4 px-6 py-4
                       hover:bg-gray-50 transition">
                  <!-- Avatar -->
                  <div class="flex-shrink-0">
                    <img *ngIf="u.photoProfil"
                         [src]="u.photoProfil"
                         class="w-10 h-10 rounded-xl object-cover">
                    <div *ngIf="!u.photoProfil"
                         class="w-10 h-10 rounded-xl flex items-center
                           justify-center font-black text-white text-sm"
                         [style.background]="couleurRole(u.role)">
                      {{u.prenom?.[0]}}{{u.nom?.[0]}}
                    </div>
                  </div>
                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-900 text-sm">
                      {{u.prenom}} {{u.nom}}
                    </p>
                    <p class="text-gray-400 text-xs truncate">
                      {{u.email}}
                    </p>
                  </div>
                  <!-- Badge rôle -->
                  <span class="text-xs px-2.5 py-1 rounded-full font-bold
                             flex-shrink-0"
                        [style.background]="couleurRole(u.role) + '22'"
                        [style.color]="couleurRole(u.role)">
                  {{libelleRole(u.role)}}
                </span>
                  <!-- Statut -->
                  <span class="text-xs px-2.5 py-1 rounded-full font-bold
                             flex-shrink-0"
                        [ngClass]="classeStatut(u.statut)">
                  {{libelleStatut(u.statut)}}
                </span>
                </div>
                <div *ngIf="!activiteRecente.length"
                     class="px-6 py-8 text-center text-gray-400 text-sm">
                  Aucune activité récente
                </div>
              </div>
            </div>

            <!-- Répartition rôles (1/3) -->
            <div class="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 class="font-black text-gray-900 mb-6">
                Répartition
              </h3>
              <div class="space-y-5">
                <div *ngFor="let r of repartition">
                  <div class="flex justify-between items-center mb-1.5">
                  <span class="text-sm font-semibold text-gray-700">
                    {{r.libelle}}
                  </span>
                    <span class="text-sm font-black"
                          [style.color]="r.couleur">
                    {{stats ? stats[r.cle] : 0}}
                  </span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full h-2">
                    <div class="h-2 rounded-full transition-all duration-700"
                         [style.background]="r.couleur"
                         [style.width]="getPct(r.cle) + '%'">
                    </div>
                  </div>
                  <p class="text-xs text-gray-400 mt-1">
                    {{getPct(r.cle)}}% du total
                  </p>
                </div>
              </div>

              <!-- Statut résumé -->
              <div class="mt-6 pt-6 border-t space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">✅ Actifs</span>
                  <span class="font-bold text-green-600">
                  {{stats?.actifs ?? 0}}
                </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">⏳ En attente</span>
                  <span class="font-bold text-yellow-600">
                  {{stats?.enAttente ?? 0}}
                </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">🚫 Bannis</span>
                  <span class="font-bold text-red-600">
                  {{stats?.bannis ?? 0}}
                </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Charts (Enriched Dashboard IA) -->
          <div class="mt-8 space-y-8">
            <h3 class="text-xl font-black mb-6" style="color:var(--forest);font-family:var(--font-heading)">
              📊 Analyse Intelligente & IA
            </h3>

            <!-- Bannière d'Alertes -->
            <div *ngIf="alertesCount > 0" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-4 mb-6 animate-pulse">
              <span class="text-2xl">🚨</span>
              <div>
                <p class="font-bold text-red-800">Alertes Intelligentes</p>
                <p class="text-sm text-red-700">Pic de réclamations détecté à Sousse (+25% ce mois). Vérifiez les derniers signalements.</p>
              </div>
            </div>

            <!-- Grille 1 : Avis et Sentiment -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 class="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Répartition Sentiment</h4>
                <div class="relative h-64">
                  <canvas #sentimentChart></canvas>
                </div>
              </div>
              <div class="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 class="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Évolution du Sentiment (6 mois)</h4>
                <div class="relative h-64">
                  <canvas #sentimentEvolutionChart></canvas>
                </div>
              </div>
            </div>

            <!-- Grille 2 : KPIs & Jauges -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <h4 class="text-xs font-bold text-gray-400 mb-2 uppercase">Score Santé Plateforme</h4>
                <div class="text-4xl font-black text-green-600">84<span class="text-sm text-gray-400">/100</span></div>
                <div class="mt-2 text-xs text-green-500 font-bold">↑ +4% vs mois dernier</div>
              </div>
              <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <h4 class="text-xs font-bold text-gray-400 mb-2 uppercase">Temps de Résolution</h4>
                <div class="text-4xl font-black text-forest">2.4<span class="text-sm text-gray-400"> jours</span></div>
                <div class="mt-2 text-xs text-green-500 font-bold">↓ -0.5j (plus rapide)</div>
              </div>
              <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 class="text-xs font-bold text-gray-400 mb-4 uppercase text-center">Taux Résolution Global</h4>
                <div class="relative h-32">
                  <canvas #resolutionRateChart></canvas>
                </div>
              </div>
              <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 class="text-xs font-bold text-gray-400 mb-4 uppercase text-center">Réponse aux Avis</h4>
                <div class="relative h-32">
                  <canvas #responseRateChart></canvas>
                </div>
              </div>
            </div>

            <!-- Grille 3 : Réclamations & Ratings -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 class="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Réclamations par Catégorie</h4>
                <div class="relative h-64">
                  <canvas #reclamationCategoryChart></canvas>
                </div>
              </div>
              <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 class="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Note Moyenne / Profil</h4>
                <div class="relative h-64">
                  <canvas #userRatingChart></canvas>
                </div>
              </div>
            </div>

            <!-- Grille 4 : Top Proprietaires & Liste -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 class="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Top Propriétaires les Mieux Notés</h4>
                <div class="space-y-4">
                  <div *ngFor="let p of topProprietaires" class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs">👤</div>
                      <span class="text-sm font-bold">{{p.nom}}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-yellow-500">⭐ {{p.note}}</span>
                      <span class="text-xs text-gray-400">({{p.avis}} avis)</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 class="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Propriétaires les plus réclamés</h4>
                <div class="space-y-4">
                  <div *ngFor="let p of worstProprietaires" class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs">⚠️</div>
                      <span class="text-sm font-bold">{{p.nom}}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-red-500 font-bold">{{p.reclamations}} récl.</span>
                      <span class="text-xs text-gray-400">({{p.tendance}})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- ══ EN ATTENTE ═════════════════════════════════════ -->
        <div *ngIf="onglet === 'en-attente'" class="space-y-4">

          <div *ngIf="!enAttente.length"
               class="bg-white rounded-2xl border border-gray-100
                 p-16 text-center">
            <span class="text-5xl block mb-4">✅</span>
            <p class="text-gray-500 font-medium">
              Aucun utilisateur en attente d'approbation
            </p>
          </div>

          <div *ngFor="let u of enAttente"
               class="bg-white rounded-2xl border border-gray-100 p-6
                 flex items-center gap-6 hover:shadow-md transition-all">
            <!-- Avatar / Photo -->
            <div class="flex-shrink-0">
              <img *ngIf="u.photoProfil"
                   [src]="u.photoProfil"
                   class="w-14 h-14 rounded-2xl object-cover border-2
                     border-gray-100">
              <div *ngIf="!u.photoProfil"
                   class="w-14 h-14 rounded-2xl flex items-center
                     justify-center font-black text-white text-xl"
                   [style.background]="couleurRole(u.role)">
                {{u.prenom[0]}}{{u.nom[0]}}
              </div>
            </div>
            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <p class="font-black text-gray-900">
                  {{u.prenom}} {{u.nom}}
                </p>
                <span class="text-xs px-2.5 py-1 rounded-full font-bold"
                      [style.background]="couleurRole(u.role) + '22'"
                      [style.color]="couleurRole(u.role)">
                {{libelleRole(u.role)}}
              </span>
                <span *ngIf="u.photoProfil"
                      class="text-xs bg-green-100 text-green-700 px-2 py-0.5
                       rounded-full font-bold">
                📷 Photo ✓
              </span>
                <span *ngIf="!u.photoProfil"
                      class="text-xs bg-orange-100 text-orange-700 px-2 py-0.5
                       rounded-full font-bold">
                📷 Pas de photo
              </span>
              </div>
              <p class="text-gray-500 text-sm truncate">{{u.email}}</p>
              <p class="text-gray-400 text-xs mt-1">
                📅 {{u.creeLe | date:'dd/MM/yyyy à HH:mm'}}
              </p>
            </div>
            <!-- Actions -->
            <div class="flex gap-2 flex-shrink-0">
              <button (click)="approuver(u.id)"
                      class="bg-green-500 text-white px-5 py-2.5 rounded-xl
                     text-sm font-bold hover:bg-green-600 transition">
                ✓ Approuver
              </button>
              <button (click)="rejeter(u.id)"
                      class="bg-red-50 text-red-600 border border-red-200
                     px-5 py-2.5 rounded-xl text-sm font-bold
                     hover:bg-red-100 transition">
                ✗ Rejeter
              </button>
            </div>
          </div>

        </div>

        <!-- ══ TOUS LES UTILISATEURS ══════════════════════════ -->
        <div *ngIf="onglet === 'utilisateurs'">
          <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">

            <!-- Filtres -->
            <div class="p-5 border-b flex flex-wrap items-center gap-4
                      bg-gray-50">
              <input [(ngModel)]="recherche"
                     placeholder="🔍 Rechercher par nom, email..."
                     class="border border-gray-200 rounded-xl px-4 py-2.5
                     text-sm flex-1 min-w-48 focus:outline-none
                     focus:ring-2 focus:ring-green-400 bg-white">
              <select [(ngModel)]="filtreRole"
                      class="border border-gray-200 rounded-xl px-4 py-2.5
                     text-sm focus:outline-none bg-white">
                <option value="">Tous les rôles</option>
                <option value="ETUDIANT">Étudiants</option>
                <option value="PROPRIETAIRE">Propriétaires</option>
                <option value="PRESTATAIRE">Prestataires</option>
              </select>
              <select [(ngModel)]="filtreStatut"
                      class="border border-gray-200 rounded-xl px-4 py-2.5
                     text-sm focus:outline-none bg-white">
                <option value="">Tous les statuts</option>
                <option value="ACTIF">Actifs</option>
                <option value="EN_ATTENTE_ADMIN">En attente</option>
                <option value="BANNI">Bannis</option>
                <option value="REJETE">Rejetés</option>
              </select>
              <span class="text-gray-400 text-sm ml-auto font-medium">
              {{utilisateursFiltres.length}} résultat(s)
            </span>
            </div>

            <!-- Tableau -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="text-left p-4 font-semibold text-gray-500
                             text-xs uppercase tracking-wide">
                    Utilisateur
                  </th>
                  <th class="text-left p-4 font-semibold text-gray-500
                             text-xs uppercase tracking-wide">Photo</th>
                  <th class="text-left p-4 font-semibold text-gray-500
                             text-xs uppercase tracking-wide">Rôle</th>
                  <th class="text-left p-4 font-semibold text-gray-500
                             text-xs uppercase tracking-wide">Statut</th>
                  <th class="text-left p-4 font-semibold text-gray-500
                             text-xs uppercase tracking-wide">
                    Inscription
                  </th>
                  <th class="text-left p-4 font-semibold text-gray-500
                             text-xs uppercase tracking-wide">Actions</th>
                </tr>
                </thead>
                <tbody>
                <tr *ngFor="let u of utilisateursFiltres"
                    class="border-b hover:bg-gray-50/50 transition">
                  <td class="p-4">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl flex items-center
                                  justify-center font-black text-white
                                  text-xs flex-shrink-0 overflow-hidden">
                        <img *ngIf="u.photoProfil"
                             [src]="u.photoProfil"
                             class="w-full h-full object-cover">
                        <div *ngIf="!u.photoProfil"
                             class="w-full h-full flex items-center
                                 justify-center"
                             [style.background]="couleurRole(u.role)">
                          {{u.prenom[0]}}{{u.nom[0]}}
                        </div>
                      </div>
                      <div>
                        <p class="font-semibold text-gray-900">
                          {{u.prenom}} {{u.nom}}
                        </p>
                        <p class="text-gray-400 text-xs">{{u.email}}</p>
                      </div>
                    </div>
                  </td>
                  <td class="p-4">
                    <span *ngIf="u.photoProfil"
                          class="text-green-600 font-bold text-lg">✓</span>
                    <span *ngIf="!u.photoProfil"
                          class="text-red-400 font-bold text-lg">✗</span>
                  </td>
                  <td class="p-4">
                    <span class="text-xs px-2.5 py-1 rounded-full font-bold"
                          [style.background]="couleurRole(u.role) + '22'"
                          [style.color]="couleurRole(u.role)">
                      {{libelleRole(u.role)}}
                    </span>
                  </td>
                  <td class="p-4">
                    <span class="text-xs px-2.5 py-1 rounded-full font-bold"
                          [ngClass]="classeStatut(u.statut)">
                      {{libelleStatut(u.statut)}}
                    </span>
                  </td>
                  <td class="p-4 text-gray-400 text-xs">
                    {{u.creeLe | date:'dd/MM/yyyy'}}
                  </td>
                  <td class="p-4">
                    <div class="flex gap-2">
                      <button *ngIf="u.statut === 'EN_ATTENTE_ADMIN'"
                              (click)="approuver(u.id)"
                              class="text-xs bg-green-100 text-green-700
                               px-3 py-1.5 rounded-lg hover:bg-green-200
                               transition font-medium">
                        Approuver
                      </button>
                      <button *ngIf="u.statut !== 'BANNI'"
                              (click)="bannir(u.id)"
                              class="text-xs bg-gray-100 text-gray-600
                               px-3 py-1.5 rounded-lg hover:bg-red-100
                               hover:text-red-600 transition font-medium">
                        Bannir
                      </button>
                      <button *ngIf="u.statut === 'BANNI'"
                              (click)="debannir(u.id)"
                              class="text-xs bg-green-100 text-green-700
                               px-3 py-1.5 rounded-lg hover:bg-green-200
                               transition font-medium">
                        Débannir
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="!utilisateursFiltres.length">
                  <td colspan="6"
                      class="p-12 text-center text-gray-400">
                    Aucun résultat trouvé
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ══ ANNONCES ═══════════════════════════════════════ -->
        <div *ngIf="onglet === 'annonces'" class="space-y-6">
          <!-- Stats annonces -->
          <div class="grid grid-cols-4 gap-4">
            <div class="stat-card p-4 text-center">
              <p class="text-2xl font-bold" style="color:var(--forest);font-family:var(--font-heading)">
                {{totalAnnonces()}}
              </p>
              <p class="text-xs" style="color:var(--stone)">Total annonces</p>
            </div>
            <div class="stat-card p-4 text-center">
              <p class="text-2xl font-bold" style="color:var(--green);font-family:var(--font-heading)">
                {{annoncesPubliees()}}
              </p>
              <p class="text-xs" style="color:var(--stone)">Publiées</p>
            </div>
            <div class="stat-card p-4 text-center">
              <p class="text-2xl font-bold" style="color:var(--gold);font-family:var(--font-heading)">
                {{annoncesBrouillons()}}
              </p>
              <p class="text-xs" style="color:var(--stone)">Brouillons</p>
            </div>
            <div class="stat-card p-4 text-center">
              <p class="text-2xl font-bold" style="color:#ef4444;font-family:var(--font-heading)">
                {{annoncesSignalees()}}
              </p>
              <p class="text-xs" style="color:var(--stone)">Signalées</p>
            </div>
          </div>

          <!-- Filtres -->
          <div class="bg-white rounded-xl p-4 shadow-sm" style="border:1px solid rgba(168,200,180,0.3)">
            <div class="flex flex-wrap items-center gap-4">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold" style="color:var(--forest)">Filtres:</span>
              </div>
              <select [(ngModel)]="filtreStatutAnnonce"
                      class="text-sm px-3 py-2 rounded-lg border"
                      style="border-color:var(--cream-dk);background:var(--white)">
                <option *ngFor="let s of statutsAnnonce" [value]="s.value">{{s.label}}</option>
              </select>
              <select [(ngModel)]="filtreTypeLogement"
                      class="text-sm px-3 py-2 rounded-lg border"
                      style="border-color:var(--cream-dk);background:var(--white)">
                <option value="">Tous les types</option>
                <option value="STUDIO">Studio</option>
                <option value="APPARTEMENT">Appartement</option>
                <option value="MAISON">Maison</option>
                <option value="COLOCATION">Colocation</option>
              </select>
              <span class="ml-auto text-sm" style="color:var(--stone)">
              {{filteredAnnonces().length}} annonce(s)
            </span>
            </div>
          </div>

          <!-- Loading -->
          <div *ngIf="isLoadingAnnonces()" class="flex items-center justify-center h-64">
            <div class="text-center">
              <div class="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
                   style="border-color:var(--cream-dk);border-top-color:var(--green)"></div>
              <p style="color:var(--stone)">Chargement des annonces...</p>
            </div>
          </div>

          <!-- Error -->
          <div *ngIf="!isLoadingAnnonces() && hasErrorAnnonces()"
               class="max-w-md mx-auto rounded-xl p-6 text-center"
               style="background:#fef2f2;border:1px solid #fecaca">
            <p style="color:#dc2626">Erreur lors du chargement.</p>
          </div>

          <!-- Grid annonces -->
          <div *ngIf="!isLoadingAnnonces() && !hasErrorAnnonces()"
               class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div *ngIf="filteredAnnonces().length === 0" class="col-span-full text-center py-12">
              <p style="color:var(--stone)">Aucune annonce trouvée</p>
            </div>
            <app-annonce-card
              *ngFor="let annonce of filteredAnnonces()"
              [annonce]="annonce">
            </app-annonce-card>
          </div>
        </div>

        <!-- ══ SERVICES ════════════ -->
        <div *ngIf="onglet === 'services'" class="space-y-5">

          <!-- Stats row -->
          <div class="grid grid-cols-4 gap-4">
            <div class="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <p class="text-2xl font-black" style="color:var(--forest)">{{servicesDemandes.length}}</p>
              <p class="text-xs mt-1" style="color:var(--stone)">Total demandes</p>
            </div>
            <div class="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <p class="text-2xl font-black text-yellow-600">{{servicesParStatut('EN_ATTENTE')}}</p>
              <p class="text-xs mt-1" style="color:var(--stone)">En attente</p>
            </div>
            <div class="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <p class="text-2xl font-black text-green-600">{{servicesParStatut('ACCEPTEE')}}</p>
              <p class="text-xs mt-1" style="color:var(--stone)">Acceptées</p>
            </div>
            <div class="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <p class="text-2xl font-black text-red-500">{{servicesParStatut('REFUSEE')}}</p>
              <p class="text-xs mt-1" style="color:var(--stone)">Refusées</p>
            </div>
          </div>

          <!-- Filters -->
          <div class="bg-white rounded-xl p-4 border border-gray-100 flex flex-wrap gap-3 items-center">
            <input [(ngModel)]="rechercheService" placeholder="🔍 Demandeur, prestataire, problème..."
              class="border border-gray-200 rounded-xl px-4 py-2.5 text-sm flex-1 min-w-48
                     focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
            <select [(ngModel)]="filtreStatutService"
              class="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-white">
              <option value="">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="ACCEPTEE">Acceptée</option>
              <option value="REFUSEE">Refusée</option>
            </select>
            <span class="text-sm ml-auto" style="color:var(--stone)">
              {{servicesFiltres.length}} demande(s)
            </span>
          </div>

          <!-- Table -->
          <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div *ngIf="chargementServices" class="flex items-center justify-center h-40">
              <div class="w-10 h-10 border-4 rounded-full animate-spin"
                   style="border-color:var(--cream-dk);border-top-color:var(--green)"></div>
            </div>
            <div *ngIf="!chargementServices" class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Demandeur</th>
                    <th class="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Prestataire</th>
                    <th class="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Spécialité</th>
                    <th class="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Problème</th>
                    <th class="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Date</th>
                    <th class="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Ville</th>
                    <th class="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Statut</th>
                    <th class="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Créée le</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let d of servicesFiltres" class="border-b hover:bg-gray-50/50 transition">
                    <td class="p-4">
                      <p class="font-semibold text-gray-900">{{d.demandeurPrenom}} {{d.demandeurNom}}</p>
                      <p class="text-gray-400 text-xs">{{d.demandeurEmail}}</p>
                    </td>
                    <td class="p-4">
                      <p class="font-semibold text-gray-900">{{d.prestatairePrenom}} {{d.prestataireNom}}</p>
                      <p class="text-gray-400 text-xs">{{d.prestataireEmail}}</p>
                    </td>
                    <td class="p-4">
                      <span class="text-xs px-2.5 py-1 rounded-full font-bold"
                            style="background:rgba(184,146,42,0.15);color:#B8922A">
                        {{d.prestataireSpecialite || '—'}}
                      </span>
                    </td>
                    <td class="p-4 max-w-[180px]">
                      <p class="text-gray-700 text-xs truncate" [title]="d.probleme">{{d.probleme}}</p>
                    </td>
                    <td class="p-4 text-gray-700 text-xs whitespace-nowrap">
                      {{d.dateService | date:'dd/MM/yyyy'}} à {{d.heureService}}
                    </td>
                    <td class="p-4 text-gray-500 text-xs">{{d.ville}}</td>
                    <td class="p-4">
                      <span class="text-xs px-2.5 py-1 rounded-full font-bold"
                        [ngClass]="{
                          'bg-yellow-100 text-yellow-700': d.statut === 'EN_ATTENTE',
                          'bg-green-100 text-green-700':  d.statut === 'ACCEPTEE',
                          'bg-red-100 text-red-600':      d.statut === 'REFUSEE'
                        }">
                        {{d.statut === 'EN_ATTENTE' ? '⏳ En attente' : d.statut === 'ACCEPTEE' ? '✅ Acceptée' : '❌ Refusée'}}
                      </span>
                    </td>
                    <td class="p-4 text-gray-400 text-xs whitespace-nowrap">
                      {{d.creeLe | date:'dd/MM/yyyy'}}
                    </td>
                  </tr>
                  <tr *ngIf="!servicesFiltres.length">
                    <td colspan="8" class="p-12 text-center text-gray-400">Aucune demande trouvée</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ══ RÉCLAMATIONS / IA ════════════ -->
        <div *ngIf="onglet === 'reclamations'">
          <app-reclamation-list></app-reclamation-list>
        </div>
        <div *ngIf="onglet === 'avis'">
          <app-avis-list (newAlertsEvent)="updateAlertesCount($event)"></app-avis-list>
        </div>

      </main>
    </div>
  `
})
export class AdminComponent implements OnInit, AfterViewInit {

  @ViewChild('sentimentChart') sentimentChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sentimentEvolutionChart') sentimentEvolutionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('resolutionRateChart') resolutionRateChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('responseRateChart') responseRateChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('reclamationCategoryChart') reclamationCategoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('userRatingChart') userRatingChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('priorityChart') priorityChartRef!: ElementRef<HTMLCanvasElement>;

  topProprietaires = [
    { nom: 'Sami Ben Ali', note: 4.9, avis: 24 },
    { nom: 'Ines Mansouri', note: 4.8, avis: 18 },
    { nom: 'Mohamed Trabelsi', note: 4.7, avis: 32 }
  ];

  worstProprietaires = [
    { nom: 'Rami Guezguez', reclamations: 8, tendance: '↑ en hausse' },
    { nom: 'Salma Feki', reclamations: 5, tendance: '→ stable' },
    { nom: 'Firas Hammami', reclamations: 4, tendance: '↓ en baisse' }
  ];

  avisStats: AvisStats | null = null;
  reclamationStats: ReclamationStats | null = null;
  private chartsReady = false;
  private dataReady = false;
  private isBrowser: boolean;

  onglet            = 'apercu';
  enAttente:        Utilisateur[]            = [];
  tousUtilisateurs: Utilisateur[]            = [];
  activiteRecente:  any[]                    = [];
  stats:            StatistiquesAdmin | null = null;
  recherche         = '';
  filtreRole        = '';
  filtreStatut      = '';
  utilisateur:      any = null;

  // ── SERVICES ──
  servicesDemandes: DemandeServiceResponse[] = [];
  chargementServices = false;
  rechercheService = '';
  filtreStatutService = '';
  alertesCount      = 0;
  aujourdhui        = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  private readonly API = `${environment.apiUrl}/api/admin`;

  navigation = [
    { cle: 'apercu',       libelle: 'Tableau de bord', icone: '📊' },
    { cle: 'en-attente',   libelle: 'À approuver',     icone: '⏳' },
    { cle: 'utilisateurs', libelle: 'Utilisateurs',    icone: '👥' },
    { cle: 'annonces',     libelle: 'Annonces',        icone: '🏠' },
    { cle: 'services',     libelle: 'Services',        icone: '🔧' },
    { cle: 'reclamations', libelle: 'Réclamations',    icone: '📬' },
    { cle: 'avis',         libelle: 'Avis & Rating',   icone: '⭐' }
  ];

  titres: Record<string, string> = {
    'apercu':       'Tableau de bord',
    'en-attente':   'Utilisateurs à approuver',
    'utilisateurs': 'Gestion des utilisateurs',
    'annonces':     'Gestion des annonces',
    'services':     'Gestion des services',
    'reclamations': 'Gestion des Réclamations',
    'avis':         'Gestion des Avis'
  };

  // ── ANNONCES ──
  private annonceService = inject(AnnonceService);
  allAnnonces = signal<AnnonceLocationDTO[]>([]);
  isLoadingAnnonces = signal(true);
  hasErrorAnnonces = signal(false);

  filtreProprietaire = signal<string>('');
  filtreStatutAnnonce = signal<string>('');
  filtreTypeLogement = signal<string>('');

  totalAnnonces = computed(() => this.allAnnonces().length);
  annoncesPubliees = computed(() => this.allAnnonces().filter(a => a.etatAnnonce === 'PUBLIEE').length);
  annoncesBrouillons = computed(() => this.allAnnonces().filter(a => a.etatAnnonce === 'BROUILLON').length);
  annoncesSignalees = computed(() => this.allAnnonces().filter(a => a.statutModeration === 'SIGNALE').length);

  filteredAnnonces = computed(() =>
    this.allAnnonces().filter(a =>
      (!this.filtreStatutAnnonce() || a.etatAnnonce === this.filtreStatutAnnonce()) &&
      (!this.filtreTypeLogement() || a.typeLogement === this.filtreTypeLogement())
    )
  );

  statutsAnnonce = [
    { value: '', label: 'Tous' },
    { value: 'BROUILLON', label: 'Brouillon' },
    { value: 'PUBLIEE', label: 'Publiée' },
    { value: 'INDISPONIBLE', label: 'Indisponible' },
    { value: 'ARCHIVEE', label: 'Archivée' }
  ];

  cartesStat: {
    cle:     keyof StatistiquesAdmin;
    libelle: string;
    icone:   string;
    couleur: string;
    lien?:   string;
  }[] = [
    { cle:'total',     libelle:'Utilisateurs',  icone:'👥', couleur:'#357A52', lien:'utilisateurs' },
    { cle:'enAttente', libelle:'En attente',    icone:'⏳', couleur:'#B8922A', lien:'en-attente'   },
    { cle:'actifs',    libelle:'Actifs',        icone:'✅', couleur:'#22c55e'                       },
    { cle:'bannis',    libelle:'Bannis',        icone:'🚫', couleur:'#ef4444'                       }
  ];

  repartition: {
    cle: keyof StatistiquesAdmin; libelle: string; couleur: string
  }[] = [
    { cle:'etudiants',     libelle:'Étudiants',     couleur:'#357A52' },
    { cle:'proprietaires', libelle:'Propriétaires', couleur:'#22c55e' },
    { cle:'prestataires',  libelle:'Prestataires',  couleur:'#B8922A' }
  ];

  constructor(
    private http:               HttpClient,
    public  authService:        AuthService,
    private avisService:        AvisService,
    private reclamationService: ReclamationService,
    private demandeServiceSvc:  DemandeServiceService,
    private route:              ActivatedRoute,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.utilisateur = this.authService.getSnapshot();
    this.chargerDonnees();
    this.loadAllAnnonces();
    this.chargerStatsIA();

    // Sync onglet with query params from AdminShellComponent nav
    this.route.queryParams.subscribe(params => {
      this.onglet = params['onglet'] || 'apercu';
      if (this.onglet === 'services' && !this.servicesDemandes.length) {
        this.chargerServices();
      }
    });
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    this.tryRenderCharts();
  }

  chargerStatsIA(): void {
    this.avisService.getStats().subscribe(stats => {
      this.avisStats = stats;
      this.tryRenderCharts();
    });
    this.reclamationService.getStats().subscribe(stats => {
      this.reclamationStats = stats;
      this.tryRenderCharts();
    });
  }

  private tryRenderCharts(): void {
    if (!this.isBrowser || !this.chartsReady || !this.avisStats || !this.reclamationStats || this.onglet !== 'apercu') return;
    if (this.dataReady) return;
    this.dataReady = true;

    import('chart.js/auto').then(({ default: Chart }) => {
      this.renderSentimentChart(Chart);
      this.renderSentimentEvolutionChart(Chart);
      this.renderResolutionRateChart(Chart);
      this.renderResponseRateChart(Chart);
      this.renderReclamationCategoryChart(Chart);
      this.renderUserRatingChart(Chart);
      this.renderStatusChart(Chart);
      this.renderPriorityChart(Chart);
    });
  }

  private renderSentimentChart(Chart: any): void {
    const dist = this.avisStats!.sentimentDistribution || {};
    new Chart(this.sentimentChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Positif', 'Neutre', 'Négatif'],
        datasets: [{
          data: [dist['POSITIVE'] || 0, dist['NEUTRAL'] || 0, dist['NEGATIVE'] || 0],
          backgroundColor: ['#22c55e', '#f59e0b', '#ef4444']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }

  private renderSentimentEvolutionChart(Chart: any): void {
    new Chart(this.sentimentEvolutionChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
        datasets: [{
          label: 'Sentiment Positif (%)',
          data: [65, 70, 68, 75, 82, 84],
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
    });
  }

  private renderResolutionRateChart(Chart: any): void {
    new Chart(this.resolutionRateChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [92, 8],
          backgroundColor: ['#22c55e', '#f1f5f9'],
          circumference: 180,
          rotation: 270,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { tooltip: { enabled: false }, legend: { display: false } },
        cutout: '75%'
      }
    });
  }

  private renderResponseRateChart(Chart: any): void {
    new Chart(this.responseRateChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [75, 25],
          backgroundColor: ['#3b82f6', '#f1f5f9'],
          circumference: 180,
          rotation: 270,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { tooltip: { enabled: false }, legend: { display: false } },
        cutout: '75%'
      }
    });
  }

  private renderReclamationCategoryChart(Chart: any): void {
    new Chart(this.reclamationCategoryChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Paiement', 'Bruit', 'Équipement', 'Hygiène', 'Autre'],
        datasets: [{
          label: 'Nombre de réclamations',
          data: [15, 8, 12, 5, 3],
          backgroundColor: '#3b82f6',
          borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }

  private renderUserRatingChart(Chart: any): void {
    new Chart(this.userRatingChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Étudiants', 'Propriétaires'],
        datasets: [{
          label: 'Note Moyenne',
          data: [4.2, 4.7],
          backgroundColor: ['#357A52', '#22c55e'],
          borderRadius: 12
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, max: 5 } },
        plugins: { legend: { display: false } }
      }
    });
  }

  private renderStatusChart(Chart: any): void {
    const dist = this.reclamationStats!.statusDistribution || {};
    new Chart(this.statusChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['En attente', 'En cours', 'Résolu', 'Rejeté'],
        datasets: [{
          label: 'Réclamations',
          data: [dist['PENDING'] || 0, dist['IN_PROGRESS'] || 0, dist['RESOLVED'] || 0, dist['REJECTED'] || 0],
          backgroundColor: ['#f59e0b', '#3b82f6', '#22c55e', '#ef4444']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  private renderPriorityChart(Chart: any): void {
    const dist = this.reclamationStats!.priorityDistribution || {};
    new Chart(this.priorityChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Haute', 'Moyenne', 'Basse'],
        datasets: [{
          data: [dist['HIGH'] || 0, dist['MEDIUM'] || 0, dist['LOW'] || 0],
          backgroundColor: ['#ef4444', '#f59e0b', '#22c55e']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }

  chargerDonnees(): void {
    this.http.get<StatistiquesAdmin>(`${this.API}/statistiques`)
      .subscribe((s: StatistiquesAdmin) => this.stats = s);
    this.http.get<Utilisateur[]>(`${this.API}/utilisateurs/en-attente`)
      .subscribe((u: Utilisateur[]) => this.enAttente = u);
    this.http.get<Utilisateur[]>(`${this.API}/utilisateurs`)
      .subscribe((u: Utilisateur[]) => this.tousUtilisateurs = u);
    this.http.get<any[]>(`${this.API}/activite-recente`)
      .subscribe((a: any[]) => this.activiteRecente = a);
  }

  loadAllAnnonces(): void {
    this.annonceService.getAll().subscribe({
      next: (data) => {
        this.allAnnonces.set(data);
        this.isLoadingAnnonces.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement annonces:', err);
        this.hasErrorAnnonces.set(true);
        this.isLoadingAnnonces.set(false);
      }
    });
  }

  get utilisateursFiltres(): Utilisateur[] {
    return this.tousUtilisateurs.filter((u: Utilisateur) => {
      const t  = this.recherche.toLowerCase();
      const ok1 = !t || `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(t);
      const ok2 = !this.filtreRole   || u.role   === this.filtreRole;
      const ok3 = !this.filtreStatut || u.statut === this.filtreStatut;
      return ok1 && ok2 && ok3;
    });
  }

  getPct(cle: keyof StatistiquesAdmin): number {
    if (!this.stats || !this.stats.total || this.stats.total === 0) return 0;
    return Math.round(((this.stats[cle] as number) / this.stats.total) * 100);
  }

  approuver(id: number): void {
    this.http.patch(`${this.API}/utilisateurs/${id}/approuver`, {})
      .subscribe(() => this.chargerDonnees());
  }
  rejeter(id: number): void {
    this.http.patch(`${this.API}/utilisateurs/${id}/rejeter`, {})
      .subscribe(() => this.chargerDonnees());
  }
  bannir(id: number): void {
    this.http.patch(`${this.API}/utilisateurs/${id}/bannir`, {})
      .subscribe(() => this.chargerDonnees());
  }
  debannir(id: number): void {
    this.http.patch(`${this.API}/utilisateurs/${id}/debannir`, {})
      .subscribe(() => this.chargerDonnees());
  }

  couleurRole(role: string): string {
    const map: Record<string, string> = {
      ETUDIANT:'#357A52', PROPRIETAIRE:'#22c55e', PRESTATAIRE:'#B8922A'
    };
    return map[role] ?? '#7A8A80';
  }
  libelleRole(role: string): string  { return LIBELLES_ROLE[role]  ?? role; }
  libelleStatut(s: string): string   { return LIBELLES_STATUT[s]   ?? s; }
  classeStatut(s: string): string {
    const map: Record<string, string> = {
      ACTIF:            'bg-green-100 text-green-700',
      EN_ATTENTE_ADMIN: 'bg-yellow-100 text-yellow-700',
      EN_ATTENTE_EMAIL: 'bg-blue-100 text-blue-700',
      BANNI:            'bg-red-100 text-red-700',
      REJETE:           'bg-red-100 text-red-700'
    };
    return map[s] ?? 'bg-gray-100 text-gray-700';
  }

  chargerServices(): void {
    this.chargementServices = true;
    this.demandeServiceSvc.toutesLesDemandes().subscribe({
      next: (data) => { this.servicesDemandes = data; this.chargementServices = false; },
      error: () => { this.chargementServices = false; }
    });
  }

  get servicesFiltres(): DemandeServiceResponse[] {
    const q = this.rechercheService.toLowerCase();
    return this.servicesDemandes.filter(d => {
      const matchQ = !q || [d.demandeurPrenom, d.demandeurNom, d.prestatairePrenom,
        d.prestataireNom, d.probleme, d.ville].join(' ').toLowerCase().includes(q);
      const matchS = !this.filtreStatutService || d.statut === this.filtreStatutService;
      return matchQ && matchS;
    });
  }

  servicesParStatut(statut: string): number {
    return this.servicesDemandes.filter(d => d.statut === statut).length;
  }

  updateAlertesCount(count: number): void {
    this.alertesCount = count;
  }
}
