import {
  Component, OnInit, OnDestroy, AfterViewInit
} from '@angular/core';
import { CommonModule }  from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder,
  FormGroup, Validators
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription }         from 'rxjs';
import { AuthService }          from '../../../../core/services/auth.service';
import { GoogleAuthService }    from '../../../../core/services/google-auth.service';
import { RecaptchaService }     from '../../../../core/services/recaptcha.service';
import { ROLES_INSCRIPTION }    from '../../../../core/models/utilisateur.model';

@Component({
  selector:   'app-inscription',
  standalone: true,
  imports:    [CommonModule, ReactiveFormsModule, RouterModule],
  styles: [`
    /* ═══════════════════════════════════════════════════════════
       INSCRIPTION - Locavia Design System
       ═══════════════════════════════════════════════════════════ */
    * { font-family: var(--font-body); margin-top: 0; }

    .left-panel {
      background: linear-gradient(160deg, var(--forest) 0%, var(--forest-mid) 60%, var(--green) 100%);
    }
    .dot-grid {
      background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px);
      background-size: 28px 28px;
    }
    .input-field {
      width: 100%;
      padding: 14px 18px;
      border: 1.5px solid var(--cream-dk);
      border-radius: var(--radius);
      font-size: 14px;
      color: var(--ink);
      background: var(--white);
      outline: none;
      transition: border-color .2s, box-shadow .2s;
      font-family: var(--font-body);
      box-sizing: border-box;
    }
    .input-field:focus {
      border-color: var(--green);
      box-shadow: 0 0 0 3px rgba(53,122,82,0.15);
    }
    .input-field.error { border-color: #ef4444; }
    .label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--forest);
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 8px;
    }
    .error-text { font-size: 11px; color: #ef4444; margin-top: 4px; display: block; }

    .btn-primary {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, var(--forest), var(--green));
      color: var(--white);
      font-weight: 700;
      font-size: 14px;
      border: none;
      border-radius: var(--radius);
      cursor: pointer;
      transition: all .25s;
      font-family: var(--font-body);
      box-shadow: 0 8px 28px rgba(28,61,42,0.35);
      letter-spacing: 0.3px;
    }
    .btn-primary:hover:not(:disabled) {
      background: var(--forest-mid);
      transform: translateY(-2px);
      box-shadow: 0 12px 36px rgba(28,61,42,0.45);
    }
    .btn-primary:disabled { opacity:.6; cursor:not-allowed; }

    .btn-outline {
      flex: 1;
      padding: 12px;
      border: 1.5px solid var(--sage);
      background: var(--white);
      border-radius: var(--radius);
      font-weight: 600;
      font-size: 14px;
      color: var(--forest);
      cursor: pointer;
      transition: all .2s;
      font-family: var(--font-body);
    }
    .btn-outline:hover { background: var(--mint); border-color: var(--green-lt); }

    .right-panel { background: var(--cream); }
    .form-card {
      background: var(--white);
      border-radius: var(--radius-lg);
      border: 1px solid rgba(168,200,180,0.4);
      box-shadow: var(--shadow-lg);
    }
    .subtitle { color: var(--stone); }

    .role-card {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;
      border: 2px solid var(--cream-dk);
      border-radius: var(--radius-lg);
      text-align: left;
      cursor: pointer;
      transition: all .2s;
      background: var(--white);
      font-family: var(--font-body);
    }
    .role-card:hover { border-color: var(--green); background: var(--mint); }
    .role-card.selected {
      border-color: var(--forest);
      background: var(--mint);
      box-shadow: 0 0 0 3px rgba(53,122,82,0.12);
    }

    @keyframes fadeUp {
      from { opacity:0; transform:translateY(14px); }
      to   { opacity:1; transform:translateY(0); }
    }
    .fade-up { animation: fadeUp .45s ease both; }
  `],
  template: `
  <div class="min-h-screen flex">

    <!-- ── PANNEAU GAUCHE ── -->
    <div class="hidden lg:flex w-[42%] flex-col justify-between left-panel p-14
                relative overflow-hidden flex-shrink-0">
      <div class="dot-grid absolute inset-0"></div>
      <div class="absolute top-0 right-0 w-96 h-96 opacity-15 pointer-events-none"
           style="background:radial-gradient(circle,var(--green-lt),transparent 70%);
                  transform:translate(120px,-120px)"></div>
      <div class="absolute bottom-0 left-0 w-72 h-72 opacity-10 pointer-events-none"
           style="background:radial-gradient(circle,var(--gold),transparent 70%);
                  transform:translate(-80px,80px)"></div>


      <div class="relative z-10">
        <h1 class="text-5xl font-black text-white leading-tight mb-5" style="font-family:var(--font-heading)">
          Votre nouveau<br>logement<br>
          <span style="color:var(--gold-lt)">commence ici.</span>
        </h1>
        <p class="text-white/70 text-base leading-relaxed max-w-sm">
          Rejoignez des milliers d'étudiants, propriétaires et prestataires sur la plateforme.
        </p>
        <div class="mt-10 space-y-3">
          <div *ngFor="let info of infos; let i = index"
            class="flex items-center gap-3 rounded-2xl px-4 py-3"
            style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08)">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center
                        font-black text-xs flex-shrink-0"
                 style="background:rgba(184,146,42,0.25);color:var(--gold-lt)">
              {{i+1}}
            </div>
            <p class="text-white/70 text-sm">{{info}}</p>
          </div>
        </div>
      </div>

      <p class="relative z-10 text-white/40 text-xs">© 2024 Locavia · Tous droits réservés</p>
    </div>

    <!-- ── FORMULAIRE ── -->
    <div class="flex-1 flex items-start justify-center p-8 overflow-y-auto right-panel"
         style="background:var(--cream);min-height:100vh">
      <div class="w-full max-w-md py-8">

        <!-- Logo -->
        <a routerLink="/" class="flex items-center gap-3 mb-8">
          <div class="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden"
               style="background:var(--forest)">
            <img src="assets/images/logo.png" alt="Locavia" class="w-full h-full object-cover">
          </div>
          <span class="font-bold text-2xl" style="font-family:var(--font-heading);color:var(--forest)">Loca<span style="color:var(--gold)">via</span></span>
        </a>

        <div class="form-card p-10 fade-up">

          <!-- Progress bar -->
          <div class="flex gap-2 mb-2">
            <div *ngFor="let i of [1,2,3]"
                 class="h-1.5 flex-1 rounded-full transition-all duration-500"
                 [style.background]="etape >= i ? 'var(--forest)' : 'var(--cream-dk)'"></div>
          </div>
          <p class="text-xs font-semibold mb-8" style="color:var(--stone)">
            ÉTAPE {{etape}} SUR 3 —
            <span style="color:var(--green)">{{titresEtapes[etape - 1]}}</span>
          </p>

          <h2 class="text-3xl font-black mb-1" style="font-family:var(--font-heading);color:var(--forest)">Créer votre compte</h2>
          <p class="subtitle text-sm mb-8">
            Déjà membre ?
            <a routerLink="/connexion"
               class="font-semibold hover:underline" style="color:var(--green)">
              Se connecter
            </a>
          </p>

          <form [formGroup]="formulaire" (ngSubmit)="soumettre()">

            <!-- ── ÉTAPE 1 ── -->
            <div *ngIf="etape === 1" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="label">Prénom *</label>
                  <input formControlName="prenom" placeholder="Sana"
                         class="input-field" [class.error]="estInvalide('prenom')">
                  <span *ngIf="estInvalide('prenom')" class="error-text">Requis</span>
                </div>
                <div>
                  <label class="label">Nom *</label>
                  <input formControlName="nom" placeholder="Ben Ali"
                         class="input-field" [class.error]="estInvalide('nom')">
                  <span *ngIf="estInvalide('nom')" class="error-text">Requis</span>
                </div>
              </div>
              <div>
                <label class="label">Adresse email *</label>
                <input formControlName="email" type="email"
                       placeholder="vous@exemple.com"
                       class="input-field" [class.error]="estInvalide('email')">
                <span *ngIf="estInvalide('email')" class="error-text">Email valide requis</span>
              </div>
              <div>
                <label class="label">
                  Téléphone
                  <span class="text-gray-400 font-normal normal-case">(optionnel)</span>
                </label>
                <input formControlName="telephone" placeholder="+216 XX XXX XXX"
                       class="input-field">
              </div>
              <div *ngIf="erreur"
                   class="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
                   style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626">
                ⚠️ {{erreur}}
              </div>
              <button type="button" (click)="etapeSuivante()" class="btn-primary mt-1">
                Continuer →
              </button>
            </div>

            <!-- ── ÉTAPE 2 ── -->
            <div *ngIf="etape === 2">
              <p class="text-gray-500 text-sm font-semibold mb-5">Je suis un(e)...</p>
              <div class="space-y-3 mb-8">
                <button type="button" *ngFor="let r of roles"
                        (click)="choisirRole(r.valeur)"
                        class="role-card"
                        [class.selected]="formulaire.get('role')?.value === r.valeur">
                  <span class="text-3xl">{{r.icone}}</span>
                  <div class="flex-1">
                    <p class="font-bold text-sm" style="color:#111827">{{r.libelle}}</p>
                    <p class="text-gray-500 text-xs mt-0.5">{{r.description}}</p>
                  </div>
                  <div class="w-5 h-5 rounded-full border-2 flex items-center
                              justify-center flex-shrink-0"
                       [style.border-color]="formulaire.get('role')?.value === r.valeur ? '#1a5c2a' : '#d1d5db'">
                    <div *ngIf="formulaire.get('role')?.value === r.valeur"
                         class="w-2.5 h-2.5 rounded-full"
                         style="background:#1a5c2a"></div>
                  </div>
                </button>
              </div>
              <div class="flex gap-3">
                <button type="button" (click)="etape = 1" class="btn-outline">← Retour</button>
                <button type="button" (click)="etapeSuivante()"
                        class="btn-primary" style="flex:1">Continuer →</button>
              </div>
            </div>

            <!-- ── ÉTAPE 3 ── -->
            <div *ngIf="etape === 3" class="space-y-4">
              <div>
                <label class="label">Mot de passe *</label>
                <div class="relative">
                  <input formControlName="motDePasse"
                         [type]="afficherMdp ? 'text' : 'password'"
                         placeholder="••••••••"
                         class="input-field" style="padding-right:48px"
                         [class.error]="estInvalide('motDePasse')">
                  <button type="button" (click)="afficherMdp = !afficherMdp"
                          class="absolute right-4 top-1/2 -translate-y-1/2
                                 text-gray-400 hover:text-gray-600 text-lg">
                    {{afficherMdp ? '🙈' : '👁️'}}
                  </button>
                </div>
                <!-- Force -->
                <div class="flex gap-1.5 mt-2">
                  <div *ngFor="let n of [1,2,3,4]"
                       class="h-1.5 flex-1 rounded-full transition-all duration-300"
                       [style.background]="couleurForce(n)"></div>
                </div>
                <p class="text-xs mt-1.5 font-semibold" [style.color]="couleurTextForce()">
                  {{libelleForce()}}
                </p>
              </div>
              <div>
                <label class="label">Confirmer le mot de passe *</label>
                <input formControlName="confirmerMdp" type="password"
                       placeholder="Répéter"
                       class="input-field" [class.error]="mdpDifferents()">
                <span *ngIf="mdpDifferents()" class="error-text">
                  Les mots de passe ne correspondent pas
                </span>
              </div>

              <div>
                <div id="recaptcha-inscription" class="mt-2"></div>
                <p *ngIf="!tokenRecaptcha && tentativeSoumission"
                   class="error-text">Veuillez compléter le reCAPTCHA</p>
              </div>

              <div *ngIf="erreur"
                   class="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
                   style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626">
                ⚠️ {{erreur}}
              </div>
              <div *ngIf="succes"
                   class="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
                   style="background:#f0faf2;border:1px solid #bbf7d0;color:#166534">
                ✅ {{succes}}
              </div>

              <div class="flex gap-3 pt-1">
                <button type="button" (click)="etape = 2"
                        [disabled]="!!succes" class="btn-outline">← Retour</button>
                <button type="submit" [disabled]="chargement || !!succes"
                        class="btn-primary" style="flex:1">
                  {{chargement ? 'Création...' : 'Créer mon compte'}}
                </button>
              </div>
            </div>

          </form>

          <!-- Google -->
          <div class="flex items-center gap-3 my-6">
            <div class="flex-1 h-px" style="background:#e5e7eb"></div>
            <span class="text-xs font-medium" style="color:#9ca3af">OU CONTINUER AVEC</span>
            <div class="flex-1 h-px" style="background:#e5e7eb"></div>
          </div>
          <div id="google-btn-inscription" class="flex justify-center"></div>

          <p class="text-center text-xs mt-6" style="color:#9ca3af">
            En vous inscrivant, vous acceptez nos
            <span class="hover:underline cursor-pointer" style="color:#1a5c2a">
              Conditions d'utilisation
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
  `
})
export class InscriptionComponent implements OnInit, AfterViewInit, OnDestroy {

  formulaire!:        FormGroup;
  etape               = 1;
  chargement          = false;
  erreur              = '';
  succes              = '';
  afficherMdp         = false;
  tokenRecaptcha      = '';
  tentativeSoumission = false;
  roles               = ROLES_INSCRIPTION;

  titresEtapes = ['Informations personnelles', 'Type de compte', 'Sécurité'];
  infos = [
    'Créez votre compte en 2 minutes',
    'Vérifiez votre adresse email',
    'Attendez l\'approbation de l\'admin',
    'Accédez à toutes les fonctionnalités'
  ];

  private subs: Subscription[] = [];

  constructor(
    private fb:               FormBuilder,
    private authService:      AuthService,
    private router:           Router,
    private googleAuth:       GoogleAuthService,
    private recaptchaService: RecaptchaService
  ) {}

  ngOnInit(): void {
    if (this.authService.estConnecte()) { this.authService.redirigerSelonRole(); return; }
    this.formulaire = this.fb.group({
      prenom:       ['', Validators.required],
      nom:          ['', Validators.required],
      email:        ['', [Validators.required, Validators.email]],
      telephone:    [''],
      role:         ['ETUDIANT', Validators.required],
      motDePasse:   ['', [Validators.required, Validators.minLength(8)]],
      confirmerMdp: ['', Validators.required]
    });
    this.googleAuth.initialiser().then(() => {
      this.googleAuth.afficherBouton('google-btn-inscription');
    });
    this.subs.push(
      this.googleAuth.token$.subscribe((token: string) => {
        this.authService.connexionGoogle(token).subscribe({
          next:  () => this.authService.redirigerSelonRole(),
          error: (e: string) => this.erreur = e
        });
      })
    );
  }

  ngAfterViewInit(): void {}
  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  etapeSuivante(): void {
    this.erreur = '';
    if (this.etape === 1) {
      const { prenom, nom, email } = this.formulaire.value;
      if (!prenom?.trim()) { this.erreur = 'Le prénom est requis'; return; }
      if (!nom?.trim())    { this.erreur = 'Le nom est requis'; return; }
      if (!email?.trim() || this.formulaire.get('email')?.invalid) {
        this.erreur = 'Email valide requis'; return;
      }
    }
    this.etape++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (this.etape === 3) {
      setTimeout(() => {
        this.recaptchaService.afficher('recaptcha-inscription', (token: string) => {
          this.tokenRecaptcha = token;
        });
      }, 100);
    }
  }

  choisirRole(valeur: string): void { this.formulaire.get('role')?.setValue(valeur); }

  estInvalide(nom: string): boolean {
    const c = this.formulaire.get(nom);
    return !!(c?.invalid && c?.touched);
  }

  mdpDifferents(): boolean {
    const mdp  = this.formulaire.get('motDePasse')?.value;
    const conf = this.formulaire.get('confirmerMdp');
    return !!(conf?.touched && mdp !== conf?.value);
  }

  private calcForce(mdp: string): number {
    return [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(r => r.test(mdp)).length;
  }

  couleurForce(niveau: number): string {
    const mdp = this.formulaire.get('motDePasse')?.value ?? '';
    const score = this.calcForce(mdp);
    if (!mdp || niveau > score) return '#e5e7eb';
    return ['','#ef4444','#f59e0b','#84cc16','#22c55e'][score] ?? '#e5e7eb';
  }

  couleurTextForce(): string {
    return ['#9ca3af','#ef4444','#f59e0b','#84cc16','#22c55e']
      [this.calcForce(this.formulaire.get('motDePasse')?.value ?? '')] ?? '#9ca3af';
  }

  libelleForce(): string {
    const mdp = this.formulaire.get('motDePasse')?.value ?? '';
    if (!mdp) return '';
    return ['','Très faible','Faible','Moyen','Fort'][this.calcForce(mdp)] ?? '';
  }

  soumettre(): void {
    this.tentativeSoumission = true;
    if (this.formulaire.get('motDePasse')?.value !== this.formulaire.get('confirmerMdp')?.value) {
      this.erreur = 'Les mots de passe ne correspondent pas'; return;
    }
    if (!this.tokenRecaptcha) { this.erreur = 'Veuillez compléter le reCAPTCHA'; return; }
    this.chargement = true; this.erreur = ''; this.succes = '';
    const { confirmerMdp, ...donnees } = this.formulaire.value;
    this.authService.inscrire({ ...donnees, recaptchaToken: this.tokenRecaptcha }).subscribe({
      next: (res: { message: string }) => {
        this.succes = res.message;
        sessionStorage.setItem('otp_email',     donnees.email);
        sessionStorage.setItem('otp_telephone', donnees.telephone ?? '');
        this.router.navigate(['/verifier-otp']);
        this.chargement = false;
      },
      error: (e: string) => {
        this.erreur = e; this.chargement = false;
        this.recaptchaService.reinitialiser(); this.tokenRecaptcha = '';
      }
    });
  }
}
