import { Component, OnInit }    from '@angular/core';
import { CommonModule }         from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule }         from '@angular/router';
import { AuthService }          from '../../../../core/services/auth.service';

@Component({
  selector:   'app-oublier-mdp',
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
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl"
                 style="background:linear-gradient(135deg,#fff3e8,#ffe4c4);border:1px solid #fed7aa">
              🔑
            </div>
            <h2 class="text-2xl font-black" style="color:#111827">Mot de passe oublié ?</h2>
            <p class="text-gray-500 text-sm mt-2 leading-relaxed">
              Entrez votre email, nous vous enverrons un lien de réinitialisation.
            </p>
          </div>

          <form [formGroup]="formulaire" (ngSubmit)="soumettre()">
            <div class="mb-5">
              <label class="block text-xs font-bold uppercase tracking-wider mb-2"
                     style="color:#374151">Adresse email</label>
              <input formControlName="email" type="email"
                     placeholder="vous@exemple.com"
                     class="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                     style="border:1.5px solid #e5e7eb;background:#fafafa;
                          font-family:'Plus Jakarta Sans',sans-serif;box-sizing:border-box">
            </div>

            <div *ngIf="message"
                 class="flex items-start gap-3 px-4 py-3 rounded-xl text-sm mb-5"
                 style="background:#f0faf2;border:1px solid #bbf7d0;color:#166534">
              <span>✅</span> {{message}}
            </div>

            <button type="submit" [disabled]="chargement || !!message"
                    class="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all"
                    style="background:linear-gradient(135deg,#1a5c2a,#2d8a42);
                         border:none;cursor:pointer;
                         font-family:'Plus Jakarta Sans',sans-serif;
                         box-shadow:0 4px 16px rgba(26,92,42,0.3)">
              {{chargement ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}}
            </button>
          </form>

          <p class="text-center mt-6 text-sm">
            <a routerLink="/connexion"
               class="font-semibold hover:underline" style="color:#1a5c2a">
              ← Retour à la connexion
            </a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class OublierMdpComponent implements OnInit {
  formulaire!: FormGroup;
  chargement = false;
  message    = '';

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  ngOnInit(): void {
    this.formulaire = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  soumettre(): void {
    if (this.formulaire.invalid) return;
    this.chargement = true;
    this.authService.oublierMotDePasse(this.formulaire.value.email).subscribe({
      next:  (res) => { this.message = res.message; this.chargement = false; },
      error: ()    => { this.chargement = false; }
    });
  }
}
