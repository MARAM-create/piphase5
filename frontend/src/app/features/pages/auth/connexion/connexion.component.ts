import {
  Component, OnInit, OnDestroy, AfterViewInit
} from '@angular/core';
import { CommonModule }         from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder,
  FormGroup, Validators
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription }         from 'rxjs';
import { AuthService }          from '../../../../core/services/auth.service';
import { GoogleAuthService }    from '../../../../core/services/google-auth.service';
import { RecaptchaService }     from '../../../../core/services/recaptcha.service';

@Component({
  selector:   'app-connexion',
  standalone: true,
  imports:    [CommonModule, ReactiveFormsModule, RouterModule],
  styles: [`
    /* ═══════════════════════════════════════════════════════════
       CONNEXION - Locavia Design System
       ═══════════════════════════════════════════════════════════ */
    * { font-family: var(--font-body); margin-top: 0; }

    /* ── PANNEAU GAUCHE ── */
    .left-panel {
      background: linear-gradient(160deg, var(--forest) 0%, var(--forest-mid) 60%, var(--green) 100%);
      font-family: var(--font-body);
    }
    .dot-grid {
      background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px);
      background-size: 28px 28px;
    }
    .orb-green {
      background: radial-gradient(circle, var(--green-lt), transparent 70%);
    }
    .orb-orange {
      background: radial-gradient(circle, var(--gold), transparent 70%);
    }

    /* ── TYPOGRAPHIE ── */
    .left-panel h1 {
      font-family: var(--font-heading);
      color: var(--white);
    }
    .left-panel .badge {
      background: rgba(184,146,42,0.2);
      border: 1px solid rgba(184,146,42,0.3);
      color: var(--gold-lt);
    }
    .left-panel .badge-dot {
      background: var(--gold-lt);
    }

    /* ── FORMULAIRE ── */
    .right-panel {
      background: var(--cream);
    }
    .form-card {
      background: var(--white);
      border-radius: var(--radius-lg);
      border: 1px solid rgba(168,200,180,0.4);
      box-shadow: var(--shadow-lg);
    }
    .form-card h2 {
      font-family: var(--font-heading);
      color: var(--forest);
    }
    .form-card .subtitle {
      color: var(--stone);
    }
    .form-card .link-green {
      color: var(--green);
      font-weight: 600;
    }
    .form-card .link-green:hover {
      color: var(--forest);
    }
    .form-card .link-gold {
      color: var(--gold);
      font-weight: 600;
    }
    .form-card .link-gold:hover {
      color: var(--gold-lt);
    }

    /* ── INPUTS ── */
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
      background: var(--white);
      box-shadow: 0 0 0 3px rgba(53,122,82,0.15);
    }
    .input-field.error {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
    }
    .label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--forest);
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 8px;
    }

    /* ── BOUTON ── */
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
    .btn-primary:disabled { opacity: .6; cursor: not-allowed; }

    /* ── ALERTES ── */
    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      border-radius: var(--radius);
    }
    .alert-warning {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: var(--radius-lg);
    }
    .alert-warning .timer {
      color: var(--gold);
      font-family: var(--font-heading);
    }
    .alert-warning .progress-bar {
      background: #fed7aa;
      border-radius: 999px;
    }
    .alert-warning .progress-fill {
      background: var(--gold);
      border-radius: 999px;
    }

    /* ── SÉPARATEUR ── */
    .divider {
      background: var(--cream-dk);
    }
    .divider-text {
      color: var(--stone);
    }

    /* ── ANIMATIONS ── */
    @keyframes fadeUp {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:translateY(0); }
    }
    .fade-up { animation: fadeUp .5s ease both; }
    .fade-up-2 { animation: fadeUp .5s .08s ease both; }
    .fade-up-3 { animation: fadeUp .5s .16s ease both; }
  `],
  template: `
  <div class="min-h-screen flex">

    <!-- ── PANNEAU GAUCHE ── -->
    <div class="hidden lg:flex w-[45%] flex-col justify-between left-panel p-14
                relative overflow-hidden">
      <div class="dot-grid absolute inset-0"></div>
      <div class="orb-green absolute top-0 right-0 w-96 h-96 opacity-15 pointer-events-none"
           style="transform:translate(120px,-120px)"></div>
      <div class="orb-orange absolute bottom-0 left-0 w-72 h-72 opacity-10 pointer-events-none"
           style="transform:translate(-80px,80px)"></div>


      <div class="relative z-10">
        <div class="badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 ">
          <span class="badge-dot w-2 h-2 rounded-full"></span>
          <span class="text-xs font-bold uppercase tracking-wider">
            Espace sécurisé
          </span>
        </div>
        <h1 class="text-5xl font-black leading-tight mb-5">
          Bon retour<br>parmi nous 👋
        </h1>
        <p class="text-white/70 text-base leading-relaxed max-w-sm">
          Connectez-vous pour accéder à votre espace personnel et gérer vos annonces.
        </p>

        <!-- Infos cards -->
        <div class="mt-12 space-y-3">
          <div *ngFor="let info of infos"
            class="flex items-center gap-3 rounded-2xl px-4 py-3"
            style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08)">
            <span class="text-xl">{{info.icone}}</span>
            <span class="text-white/70 text-sm">{{info.texte}}</span>
          </div>
        </div>
      </div>

      <p class="relative z-10 text-white/40 text-xs">© 2024 Locavia · Tous droits réservés</p>
    </div>

    <!-- ── FORMULAIRE ── -->
    <div class="right-panel flex-1 flex items-center justify-center p-8">
      <div class="w-full max-w-md">

        <!-- Logo -->
        <a routerLink="/" class="flex items-center gap-3 mb-8">
          <div class="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden"
               style="background:var(--forest)">
            <img src="assets/images/logo.png" alt="Locavia" class="w-full h-full object-cover">
          </div>
          <span class="font-bold text-2xl" style="font-family:var(--font-heading);color:var(--forest)">Loca<span style="color:var(--gold)">via</span></span>
        </a>

        <div class="form-card p-10">

          <div class="fade-up mb-8">
            <h2 class="title-locavia title-locavia-2">Connexion</h2>
            <p class="subtitle text-sm mt-2">
              Pas de compte ?
              <a routerLink="/inscription"
                 class="link-green hover:underline">
                S'inscrire gratuitement
              </a>
            </p>
          </div>

          <form [formGroup]="formulaire" (ngSubmit)="connecter()" class="fade-up-2">

            <div class="space-y-5 mb-6">
              <div>
                <label class="label">Adresse email</label>
                <input formControlName="email" type="email"
                       placeholder="vous@exemple.com"
                       class="input-field"
                       [class.error]="estInvalide('email')">
              </div>
              <div>
                <div class="flex justify-between items-center mb-1.5">
                  <label class="label" style="margin:0">Mot de passe</label>
                  <a routerLink="/oublier-mdp"
                     class="link-gold text-xs hover:underline">
                    Mot de passe oublié ?
                  </a>
                </div>
                <div class="relative">
                  <input formControlName="motDePasse"
                         [type]="afficherMdp ? 'text' : 'password'"
                         placeholder="••••••••"
                         class="input-field"
                         style="padding-right:48px"
                         [class.error]="estInvalide('motDePasse')">
                  <button type="button" (click)="afficherMdp = !afficherMdp"
                          class="absolute right-4 top-1/2 -translate-y-1/2
                                 text-stone hover:text-forest transition text-lg">
                    {{afficherMdp ? '🙈' : '👁️'}}
                  </button>
                </div>
              </div>
            </div>

            <!-- reCAPTCHA -->
            <div id="recaptcha-connexion" class="mb-5"></div>

            <!-- Erreur -->
            <div *ngIf="erreur && tempsRestant === 0"
                 class="alert-error flex items-start gap-3 px-4 py-3 text-sm mb-5">
              <span>⚠️</span> <span>{{erreur}}</span>
            </div>

            <!-- Countdown blocage -->
            <div *ngIf="tempsRestant > 0"
                 class="alert-warning p-5 mb-5 text-center">
              <div class="timer text-4xl font-black mb-1">
                {{tempsRestant}}s
              </div>
              <p class="font-semibold text-sm" style="color:#92400E">
                Trop de tentatives incorrectes
              </p>
              <p class="text-xs mt-1" style="color:#B45309">
                Veuillez patienter avant de réessayer
              </p>
              <div class="progress-bar w-full h-1.5 mt-3">
                <div class="progress-fill h-1.5 transition-all"
                     [style.width]="(tempsRestant / 30 * 100) + '%'"></div>
              </div>
            </div>

            <button type="submit"
                    [disabled]="chargement || tempsRestant > 0"
                    class="btn-primary">
              <span *ngIf="tempsRestant > 0">⏳ Bloqué {{tempsRestant}}s</span>
              <span *ngIf="!tempsRestant && chargement">Connexion en cours...</span>
              <span *ngIf="!tempsRestant && !chargement">Se connecter →</span>
            </button>
          </form>

          <div class="fade-up-3">
            <div class="flex items-center gap-3 my-6">
              <div class="divider flex-1 h-px"></div>
              <span class="divider-text text-xs font-medium">OU</span>
              <div class="divider flex-1 h-px"></div>
            </div>
            <div id="google-btn-connexion" class="flex justify-center"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `
})
export class ConnexionComponent implements OnInit, AfterViewInit, OnDestroy {

  formulaire!:    FormGroup;
  chargement    = false;
  erreur        = '';
  afficherMdp   = false;
  tokenRecaptcha = '';
  tempsRestant  = 0;

  private subs:          Subscription[] = [];
  private intervalTimer: any            = null;

  infos = [
    { icone: '🔒', texte: 'Connexion sécurisée et chiffrée' },
    { icone: '🏠', texte: 'Accès à vos annonces et demandes' },
    { icone: '💬', texte: 'Messagerie intégrée avec les utilisateurs' },
  ];

  constructor(
    private fb:               FormBuilder,
    private authService:      AuthService,
    private router:           Router,
    private googleAuth:       GoogleAuthService,
    private recaptchaService: RecaptchaService
  ) {}

  ngOnInit(): void {
    // Initialiser le formulaire AVANT le return
    this.formulaire = this.fb.group({
      email:      ['', [Validators.required, Validators.email]],
      motDePasse: ['', Validators.required]
    });
    
    if (this.authService.estConnecte()) {
      this.authService.redirigerSelonRole(); return;
    }
    this.googleAuth.initialiser().then(() => {
      this.googleAuth.afficherBouton('google-btn-connexion');
    });
    this.subs.push(
      this.googleAuth.token$.subscribe((token: string) => {
        this.chargement = true;
        this.authService.connexionGoogle(token).subscribe({
          next:  () => this.authService.redirigerSelonRole(),
          error: (e: string) => { this.erreur = e; this.chargement = false; }
        });
      })
    );
  }

  ngAfterViewInit(): void {
    this.recaptchaService.afficher('recaptcha-connexion', (token: string) => {
      this.tokenRecaptcha = token;
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.intervalTimer) clearInterval(this.intervalTimer);
  }

  estInvalide(nom: string): boolean {
    if (!this.formulaire) return false;
    const c = this.formulaire.get(nom);
    return !!(c?.invalid && c?.touched);
  }

  connecter(): void {
    if (!this.formulaire || this.formulaire.invalid) { 
      this.formulaire?.markAllAsTouched(); 
      return; 
    }
    if (this.tempsRestant > 0) return;
    this.chargement = true; this.erreur = '';
    this.authService.connecter({
      ...this.formulaire.value,
      recaptchaToken: this.tokenRecaptcha || ''
    }).subscribe({
      next: () => this.authService.redirigerSelonRole(),
      error: (e: string) => {
        this.chargement = false;
        if (e.toLowerCase().includes('bloqué') || e.toLowerCase().includes('trop de tentatives')) {
          this.lancerCountdown(30);
        }
        this.erreur = e;
        this.recaptchaService.reinitialiser();
        this.tokenRecaptcha = '';
      }
    });
  }

  lancerCountdown(secondes: number): void {
    this.tempsRestant = secondes;
    if (this.intervalTimer) clearInterval(this.intervalTimer);
    this.intervalTimer = setInterval(() => {
      this.tempsRestant--;
      if (this.tempsRestant <= 0) { this.tempsRestant = 0; this.erreur = ''; clearInterval(this.intervalTimer); }
    }, 1000);
  }
}
