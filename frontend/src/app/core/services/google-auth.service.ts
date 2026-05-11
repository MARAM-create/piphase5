import { Injectable, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject }           from 'rxjs';
import { environment }       from '../../../environments/environment';

declare const google: any;

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {

  private readonly CLIENT_ID        = environment.googleClientId;
  private _token$                   = new Subject<string>();
  token$                            = this._token$.asObservable();
  private estNavigateur:            boolean;
  private static scriptCharge       = false;
  private static googleInitialise   = false;
  private static boutonRendu        = false;

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.estNavigateur = isPlatformBrowser(this.platformId);
  }

  initialiser(): Promise<void> {
    if (!this.estNavigateur)              return Promise.resolve();
    if (GoogleAuthService.scriptCharge)   return Promise.resolve();

    return new Promise((resolve) => {
      const existant = document.getElementById('google-gsi-script');
      if (existant) {
        this.configurerGoogle();
        GoogleAuthService.scriptCharge = true;
        resolve(); return;
      }

      const script  = document.createElement('script');
      script.id     = 'google-gsi-script';
      script.src    = 'https://accounts.google.com/gsi/client';
      script.async  = true;
      script.defer  = true;
      script.onload = () => {
        GoogleAuthService.scriptCharge = true;
        this.configurerGoogle();
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  private configurerGoogle(): void {
    if (!this.estNavigateur)                return;
    if (GoogleAuthService.googleInitialise) return;

    const attendre = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts?.id) {
        clearInterval(attendre);
        if (GoogleAuthService.googleInitialise) return;
        GoogleAuthService.googleInitialise = true;

        google.accounts.id.initialize({
          client_id: this.CLIENT_ID,
          callback:  (response: any) => {
            this.ngZone.run(() => this._token$.next(response.credential));
          },
          ux_mode: 'popup'
        });
      }
    }, 200);
  }

  afficherBouton(elementId: string): void {
    if (!this.estNavigateur) return;

    // ✅ Rendre une seule fois par element
    let tentatives = 0;
    const attendre = setInterval(() => {
      tentatives++;
      if (tentatives > 30) { clearInterval(attendre); return; }

      const element = document.getElementById(elementId);
      if (element && typeof google !== 'undefined' && google.accounts?.id) {
        clearInterval(attendre);
        if (element.childElementCount > 0) return; // déjà rendu
        google.accounts.id.renderButton(element, {
          theme:          'outline',
          size:           'large',
          width:          400,
          text:           'signin_with',
          shape:          'rectangular',
          logo_alignment: 'left'
        });
      }
    }, 200);
  }
}
