
// ─── verifier-email.component.ts ─────────────────────────────
import { Component, OnInit as OnInit2 }        from '@angular/core';
import { CommonModule as CM2 }                 from '@angular/common';
import { RouterModule as RM2, ActivatedRoute as AR2 } from '@angular/router';
import { HttpClient }                          from '@angular/common/http';
import { environment }                         from '../../../../../environments/environment';

@Component({
  selector:   'app-verifier-email',
  standalone: true,
  imports:    [CM2, RM2],
  template: `
  <div class="min-h-screen flex items-center justify-center p-8"
       style="background:#f4f7f5;font-family:'Plus Jakarta Sans',sans-serif">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-3xl shadow-sm p-12 text-center"
           style="border:1px solid #e8f0ea">

        <!-- Chargement -->
        <div *ngIf="statut === 'chargement'" class="space-y-5">
          <div class="w-16 h-16 border-4 border-t-transparent rounded-full
                      animate-spin mx-auto"
               style="border-color:#1a5c2a;border-top-color:transparent"></div>
          <p class="font-semibold" style="color:#374151">Vérification en cours...</p>
        </div>

        <!-- Succès -->
        <div *ngIf="statut === 'succes'" class="space-y-4">
          <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
               style="background:linear-gradient(135deg,#f0faf2,#dcfce7);
                      border:2px solid #bbf7d0">
            <span class="text-4xl">✅</span>
          </div>
          <h2 class="text-2xl font-black" style="color:#111827">Email vérifié !</h2>
          <p class="text-gray-500 text-sm leading-relaxed">
            Votre adresse email a été vérifiée avec succès.<br>
            Votre compte est en attente de validation par un administrateur.
          </p>
          <div class="rounded-2xl p-4" style="background:#fff7ed;border:1px solid #fed7aa">
            <p class="text-sm font-semibold" style="color:#c2410c">
              ⏳ En attente de validation admin
            </p>
          </div>
          <a routerLink="/connexion"
             class="block w-full py-3.5 rounded-xl font-bold text-sm text-white"
             style="background:linear-gradient(135deg,#1a5c2a,#2d8a42);
                    box-shadow:0 4px 16px rgba(26,92,42,0.3)">
            Retour à la connexion
          </a>
        </div>

        <!-- Erreur -->
        <div *ngIf="statut === 'erreur'" class="space-y-4">
          <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
               style="background:#fef2f2;border:2px solid #fecaca">
            <span class="text-4xl">❌</span>
          </div>
          <h2 class="text-2xl font-black" style="color:#111827">Lien invalide</h2>
          <p class="text-gray-500 text-sm leading-relaxed">
            Ce lien est invalide ou a expiré. Veuillez vous réinscrire.
          </p>
          <a routerLink="/inscription"
             class="block w-full py-3.5 rounded-xl font-bold text-sm text-white"
             style="background:linear-gradient(135deg,#1a5c2a,#2d8a42);
                    box-shadow:0 4px 16px rgba(26,92,42,0.3)">
            Nouvelle inscription
          </a>
        </div>

      </div>
    </div>
  </div>
  `
})
export class VerifierEmailComponent implements OnInit2 {
  statut: 'chargement' | 'succes' | 'erreur' = 'chargement';

  constructor(private route: AR2, private http: HttpClient) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) { this.statut = 'erreur'; return; }
    this.http.get<{ message: string }>(
      `${environment.apiUrl}/auth/verifier-email?token=${token}`
    ).subscribe({
      next:  () => this.statut = 'succes',
      error: () => this.statut = 'erreur'
    });
  }
}

