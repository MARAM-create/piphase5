// ─── reinitialiser-mdp.component.ts ──────────────────────────
import { Component, OnInit }         from '@angular/core';
import { CommonModule }              from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService }               from '../../../../core/services/auth.service';

@Component({
  selector:   'app-reinitialiser-mdp',
  standalone: true,
  imports:    [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
  <div class="min-h-screen flex items-center justify-center p-8"
       style="background:#f4f7f5;font-family:'Plus Jakarta Sans',sans-serif">
    <div class="w-full max-w-md">

      <a routerLink="/" class="flex items-center gap-2 mb-8 w-fit">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
             style="background:linear-gradient(135deg,#f47c20,#e06010)">🏠</div>
        <span class="font-black text-xl" style="color:#1a5c2a">Locavia</span>
      </a>

      <div class="bg-white rounded-3xl shadow-sm p-10" style="border:1px solid #e8f0ea">

        <div class="text-center mb-8">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center
                      mx-auto mb-4 text-3xl"
               style="background:linear-gradient(135deg,#f0faf2,#dcfce7);
                      border:1px solid #bbf7d0">
            🔒
          </div>
          <h2 class="text-2xl font-black" style="color:#111827">Nouveau mot de passe</h2>
          <p class="text-gray-500 text-sm mt-2">Choisissez un mot de passe sécurisé.</p>
        </div>

        <form [formGroup]="formulaire" (ngSubmit)="soumettre()">
          <div class="space-y-4 mb-5">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-2"
                     style="color:#374151">Nouveau mot de passe</label>
              <div class="relative">
                <input formControlName="motDePasse"
                       [type]="afficherMdp ? 'text' : 'password'"
                       placeholder="••••••••"
                       class="w-full px-4 py-3 rounded-xl text-sm outline-none"
                       style="border:1.5px solid #e5e7eb;background:#fafafa;
                              font-family:inherit;box-sizing:border-box;padding-right:48px">
                <button type="button" (click)="afficherMdp = !afficherMdp"
                        class="absolute right-4 top-1/2 -translate-y-1/2
                               text-gray-400 hover:text-gray-600 text-lg">
                  {{afficherMdp ? '🙈' : '👁️'}}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-2"
                     style="color:#374151">Confirmer</label>
              <input formControlName="confirmer" type="password" placeholder="Répéter"
                     class="w-full px-4 py-3 rounded-xl text-sm outline-none"
                     style="border:1.5px solid #e5e7eb;background:#fafafa;
                            font-family:inherit;box-sizing:border-box">
            </div>
          </div>

          <div *ngIf="erreur"
               class="flex items-start gap-3 px-4 py-3 rounded-xl text-sm mb-4"
               style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626">
            ⚠️ {{erreur}}
          </div>
          <div *ngIf="succes"
               class="flex items-start gap-3 px-4 py-3 rounded-xl text-sm mb-4"
               style="background:#f0faf2;border:1px solid #bbf7d0;color:#166534">
            ✅ {{succes}}
          </div>

          <button type="submit" [disabled]="chargement || !!succes"
                  class="w-full py-3.5 rounded-xl font-bold text-sm text-white"
                  style="background:linear-gradient(135deg,#1a5c2a,#2d8a42);
                         border:none;cursor:pointer;font-family:inherit;
                         box-shadow:0 4px 16px rgba(26,92,42,0.3)">
            {{chargement ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}}
          </button>
        </form>

        <p *ngIf="succes" class="text-center mt-5 text-sm">
          <a routerLink="/connexion" class="font-semibold hover:underline" style="color:#1a5c2a">
            → Se connecter maintenant
          </a>
        </p>
      </div>
    </div>
  </div>
  `
})
export class ReinitialiserMdpComponent implements OnInit {
  formulaire!:  FormGroup;
  chargement  = false;
  erreur      = '';
  succes      = '';
  afficherMdp = false;
  private token = '';

  constructor(
    private fb:          FormBuilder,
    private route:       ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.formulaire = this.fb.group({
      motDePasse: ['', [Validators.required, Validators.minLength(8)]],
      confirmer:  ['', Validators.required]
    });
  }

  soumettre(): void {
    const { motDePasse, confirmer } = this.formulaire.value;
    if (motDePasse !== confirmer) { this.erreur = 'Les mots de passe ne correspondent pas'; return; }
    this.chargement = true; this.erreur = '';
    this.authService.reinitialiserMotDePasse(this.token, motDePasse).subscribe({
      next:  res => { this.succes = res.message; this.chargement = false; },
      error: (e: string) => { this.erreur = e; this.chargement = false; }
    });
  }
}

