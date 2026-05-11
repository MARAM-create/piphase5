import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AnnonceService } from '../../../../core/services/annonce.service';
import { AnnonceLocationDTO } from '../../../../core/models/annonce';
import { AnnonceCardComponent } from '../components/annonce-card/annonce-card.component';

@Component({
selector: 'app-mes-annonces-proprietaire',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AnnonceCardComponent
  ],
  template: `
    <section class="min-h-screen bg-[#f4f7f5] px-4 sm:px-6 lg:px-8 py-8">
      <div class="max-w-7xl mx-auto">

        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 class="text-2xl sm:text-3xl font-black text-[#0f3d1a]">
              Mes annonces
            </h1>
            <p class="text-sm text-gray-500 mt-1">
              {{ mesAnnonces().length }} annonce(s) publiée(s)
            </p>
          </div>

          <a
            routerLink="/annonces/create"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#0f3d1a] hover:bg-[#1a5c2a] transition shadow-md"
          >
            🏠 Déposer une annonce
          </a>
        </div>

        <!-- Loading -->
        <div *ngIf="isLoadingAnnonces()" class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="w-12 h-12 border-4 border-gray-200 border-t-[#1a5c2a] rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-gray-500">
              Chargement de vos annonces...
            </p>
          </div>
        </div>

        <!-- Error -->
        <div
          *ngIf="!isLoadingAnnonces() && hasErrorAnnonces()"
          class="max-w-md mx-auto bg-red-50 border border-red-200 rounded-2xl p-6 text-center"
        >
          <p class="text-red-600 font-semibold">
            Une erreur s'est produite lors du chargement.
          </p>

          <button
            type="button"
            (click)="loadMesAnnonces()"
            class="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0f3d1a] hover:bg-[#1a5c2a] transition"
          >
            Réessayer
          </button>
        </div>

        <!-- Empty State -->
        <div
          *ngIf="!isLoadingAnnonces() && !hasErrorAnnonces() && mesAnnonces().length === 0"
          class="bg-white rounded-2xl p-12 text-center shadow-sm border border-green-100"
        >
          <div class="text-6xl mb-4">🏠</div>

          <h2 class="text-xl font-black text-[#0f3d1a] mb-2">
            Vous n'avez pas encore d'annonces
          </h2>

          <p class="text-gray-500 mb-6">
            Créez votre première annonce pour trouver des locataires.
          </p>

          <a
            routerLink="/annonces/create"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#0f3d1a] hover:bg-[#1a5c2a] transition shadow-md"
          >
            🏠 Déposer une annonce
          </a>
        </div>

        <!-- Listings -->
        <div
          *ngIf="!isLoadingAnnonces() && !hasErrorAnnonces() && mesAnnonces().length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <app-annonce-card
            *ngFor="let annonce of mesAnnonces()"
            [annonce]="annonce"
          >
          </app-annonce-card>
        </div>

      </div>
    </section>
  `
})
export class MesAnnoncesProprietaireComponent implements OnInit {
  private annonceService = inject(AnnonceService);

  mesAnnonces = signal<AnnonceLocationDTO[]>([]);
  isLoadingAnnonces = signal(true);
  hasErrorAnnonces = signal(false);

  ngOnInit(): void {
    this.loadMesAnnonces();
  }

  loadMesAnnonces(): void {
    this.isLoadingAnnonces.set(true);
    this.hasErrorAnnonces.set(false);

    this.annonceService.getMesAnnonces().subscribe({
      next: (data) => {
        this.mesAnnonces.set(data);
        this.isLoadingAnnonces.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement mes annonces:', err);
        this.hasErrorAnnonces.set(true);
        this.isLoadingAnnonces.set(false);
      }
    });
  }
}
