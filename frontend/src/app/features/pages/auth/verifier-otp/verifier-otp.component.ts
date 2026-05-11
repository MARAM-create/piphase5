
// ─── verifier-otp.component.ts ───────────────────────────────
import { Component, OnInit as OnInit3, OnDestroy as OnDestroy3 } from '@angular/core';
import { CommonModule as CM3 }    from '@angular/common';
import { FormsModule }            from '@angular/forms';
import { RouterModule as RM3 }    from '@angular/router';
import { HttpClient as HC3 }      from '@angular/common/http';
import { Router as R3 }           from '@angular/router';
import { environment as env3 }    from '../../../../../environments/environment';

@Component({
  selector:   'app-verifier-otp',
  standalone: true,
  imports:    [CM3, FormsModule, RM3],
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

          <!-- Succès -->
          <div *ngIf="statut === 'succes'" class="text-center">
            <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                 style="background:linear-gradient(135deg,#f0faf2,#dcfce7);
                      border:2px solid #bbf7d0">
              <span class="text-4xl">✅</span>
            </div>
            <h2 class="text-2xl font-black mb-2" style="color:#111827">Compte vérifié !</h2>
            <p class="text-gray-500 text-sm mb-6">
              Votre compte est en attente de validation par l'administrateur.
            </p>
            <a routerLink="/connexion"
               class="block w-full py-3.5 rounded-xl font-bold text-sm text-white text-center"
               style="background:linear-gradient(135deg,#1a5c2a,#2d8a42);
                    box-shadow:0 4px 16px rgba(26,92,42,0.3)">
              Retour à la connexion
            </a>
          </div>

          <!-- Formulaire -->
          <div *ngIf="statut !== 'succes'">
            <div class="text-center mb-8">
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center
                        mx-auto mb-4 text-3xl"
                   style="background:linear-gradient(135deg,#f0faf2,#dcfce7);
                        border:1px solid #bbf7d0">
                📱
              </div>
              <h2 class="text-2xl font-black" style="color:#111827">Vérification du compte</h2>
              <p class="text-gray-500 text-sm mt-2">
                Code envoyé par <strong>{{telephone ? 'SMS' : 'email'}}</strong>
              </p>
              <p class="text-xs mt-1" style="color:#9ca3af">{{telephone || email}}</p>
            </div>

            <div class="mb-6">
              <label class="block text-xs font-bold uppercase tracking-wider text-center mb-4"
                     style="color:#374151">Code OTP à 6 chiffres</label>
              <input [(ngModel)]="otp" type="text" inputmode="numeric"
                     pattern="[0-9]*" maxlength="6"
                     (input)="onOtpInput($event)"
                     class="w-full text-center text-2xl font-black py-4 rounded-xl outline-none"
                     style="border:2px solid #1a5c2a;background:#f0faf2;
                          font-family:inherit;box-sizing:border-box;
                          color:#111827;letter-spacing:0.5em">
            </div>

            <div *ngIf="tempsRestant > 0" class="text-center mb-5">
              <p class="text-sm" style="color:#6b7280">
                Expire dans
                <span class="font-black" style="color:#1a5c2a">{{tempsRestant}}s</span>
              </p>
              <div class="w-full rounded-full h-1.5 mt-2" style="background:#e5e7eb">
                <div class="h-1.5 rounded-full transition-all"
                     style="background:linear-gradient(90deg,#1a5c2a,#2d8a42)"
                     [style.width]="(tempsRestant / 600 * 100) + '%'"></div>
              </div>
            </div>

            <div *ngIf="erreur"
                 class="flex items-start gap-2 px-4 py-3 rounded-xl text-sm mb-4"
                 style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626">
              ⚠️ {{erreur}}
            </div>

            <button (click)="verifier()" [disabled]="chargement || otp.length < 6"
                    class="w-full py-3.5 rounded-xl font-bold text-sm text-white mb-4"
                    style="background:linear-gradient(135deg,#1a5c2a,#2d8a42);
                         border:none;cursor:pointer;font-family:inherit;
                         box-shadow:0 4px 16px rgba(26,92,42,0.3)">
              {{chargement ? 'Vérification...' : 'Vérifier le code'}}
            </button>

            <div class="text-center">
              <p class="text-sm mb-1" style="color:#6b7280">Pas reçu le code ?</p>
              <button (click)="renvoyer()" [disabled]="renvoyiChargement"
                      class="text-sm font-semibold hover:underline"
                      style="background:none;border:none;cursor:pointer;
                           color:#f47c20;font-family:inherit">
                {{renvoyiChargement ? 'Envoi...' : '→ Renvoyer le code'}}
              </button>
            </div>

            <p class="text-center mt-5 text-sm">
              <a routerLink="/connexion" style="color:#9ca3af" class="hover:text-gray-600">
                ← Retour à la connexion
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VerifierOtpComponent implements OnInit3, OnDestroy3 {
  otp = ''; email = ''; telephone = '';
  chargement = false; renvoyiChargement = false;
  erreur = ''; statut = 'formulaire'; tempsRestant = 600;
  private timer: any;
  private readonly API = env3.apiUrl;

  constructor(private http: HC3, private router: R3) {}

  ngOnInit(): void {
    this.email     = sessionStorage.getItem('otp_email')     ?? '';
    this.telephone = sessionStorage.getItem('otp_telephone') ?? '';
    if (!this.email) { this.router.navigate(['/inscription']); return; }
    this.lancerTimer();
  }

  ngOnDestroy(): void { if (this.timer) clearInterval(this.timer); }

  lancerTimer(): void {
    this.tempsRestant = 600;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.tempsRestant--;
      if (this.tempsRestant <= 0) clearInterval(this.timer);
    }, 1000);
  }

  onOtpInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/[^0-9]/g, '');
    if (v.length > 6) v = v.slice(0, 6);
    input.value = v; this.otp = v;
  }

  verifier(): void {
    if (this.otp.length < 6) return;
    this.chargement = true; this.erreur = '';
    this.http.post(`${this.API}/api/auth/verifier-otp`,
      { email: this.email, otp: this.otp }
    ).subscribe({
      next:  () => { this.statut = 'succes'; this.chargement = false; sessionStorage.clear(); },
      error: (e: any) => { this.erreur = e.error?.erreur ?? 'Code invalide'; this.chargement = false; this.otp = ''; }
    });
  }

  renvoyer(): void {
    this.renvoyiChargement = true;
    this.http.post(`${this.API}/api/auth/renvoyer-otp`, { email: this.email }).subscribe({
      next:  () => { this.renvoyiChargement = false; this.erreur = ''; this.lancerTimer(); },
      error: (e: any) => { this.erreur = e.error?.erreur ?? 'Erreur'; this.renvoyiChargement = false; }
    });
  }
}
