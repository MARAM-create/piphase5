import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { AuthService } from '../../../core/services/auth.service';
import { Utilisateur } from '../../../core/models/utilisateur.model';

@Component({
  selector: 'app-etudiant-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  template: `
    <div class="min-h-screen" style="font-family: 'Plus Jakarta Sans', sans-serif;">
      <!-- Header with app-navbar -->
      <app-navbar></app-navbar>

      <!-- Hero Section with same background as accueil -->
      <section class="hero" style="position: relative; height: 100vh; min-height: 640px; overflow: hidden;">
        <video class="hero-video" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;" autoplay muted loop playsinline>
          <source src="assets/videos/home.mp4" type="video/mp4">
        </video>
        <div class="hero-overlay" style="position: absolute; inset: 0; background: linear-gradient(150deg,rgba(14,30,20,.72) 0%,rgba(22,48,32,.50) 45%,rgba(12,26,18,.68) 100%);"></div>
        <div class="hero-vignette" style="position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,.35) 100%);"></div>

        <div class="hero-body" style="position: relative; z-index: 2; height: calc(100% - 70px); margin-top: 70px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 5%;">
          <div class="hero-label" style="display: inline-flex; align-items: center; gap: 10px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.18); backdrop-filter: blur(8px); padding: 6px 16px; border-radius: 2px; font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,.8); margin-bottom: 28px;">
            <span class="hero-label-dot" style="width: 6px; height: 6px; border-radius: 50%; background: #D4AF5A;"></span>
            Plus de 2 400 logements disponibles
          </div>
          <h1 style="font-family: 'Libre Baskerville', serif; font-size: clamp(42px, 6.5vw, 80px); font-weight: 700; line-height: 1.08; color: #fff; letter-spacing: -.5px; margin-bottom: 20px; text-shadow: 0 2px 20px rgba(0,0,0,.2);">
            Bienvenue,<br>
            <em style="color: #D4AF5A; font-style: italic;">{{utilisateur?.prenom}}</em> !
          </h1>
          <p style="font-size: clamp(15px, 1.7vw, 17px); color: rgba(255,255,255,.68); max-width: 460px; line-height: 1.78; margin-bottom: 40px; font-weight: 400;">
            Votre espace personnel pour trouver le logement idéal en Tunisie.
          </p>
          <!-- No buttons - just the welcome message -->
        </div>
      </section>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  `]
})
export class EtudiantHomeComponent implements OnInit {
  private authService = inject(AuthService);
  utilisateur: Utilisateur | null = null;

  ngOnInit(): void {
    this.utilisateur = this.authService.getSnapshot();
  }
}
