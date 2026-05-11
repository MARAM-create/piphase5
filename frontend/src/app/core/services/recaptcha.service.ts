import {
  Injectable, PLATFORM_ID, Inject
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment }       from '../../../environments/environment';  // ✅ ajouter

declare const grecaptcha: any;

@Injectable({ providedIn: 'root' })
export class RecaptchaService {

  // ✅ Utiliser la vraie clé depuis environment — plus de hardcode
  private readonly SITE_KEY  = environment.recaptchaClePublique;
  private estNavigateur:     boolean;
  private scriptCharge       = false;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.estNavigateur = isPlatformBrowser(this.platformId);
  }

  chargerScript(): Promise<void> {
    if (!this.estNavigateur) return Promise.resolve();
    if (this.scriptCharge)   return Promise.resolve();

    return new Promise((resolve) => {
      if (document.getElementById('recaptcha-script')) {
        this.scriptCharge = true;
        resolve(); return;
      }
      const script    = document.createElement('script');
      script.id       = 'recaptcha-script';
      script.src      = 'https://www.google.com/recaptcha/api.js?render=explicit&hl=fr';
      script.async    = true;
      script.defer    = true;
      script.onload   = () => {
        this.scriptCharge = true;
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  afficher(elementId: string, callback: (token: string) => void): void {
    if (!this.estNavigateur) return;

    this.chargerScript().then(() => {
      let tentatives   = 0;
      const attendre   = setInterval(() => {
        tentatives++;
        if (tentatives > 50) { clearInterval(attendre); return; }

        if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
          clearInterval(attendre);
          const element = document.getElementById(elementId);
          if (element && !element.hasChildNodes()) {
            try {
              grecaptcha.render(elementId, {
                sitekey:            this.SITE_KEY,  // ✅ vraie clé
                callback:           callback,
                'expired-callback': () => callback('')
              });
            } catch (e) {
              console.log('reCAPTCHA already rendered');
            }
          }
        }
      }, 100);
    });
  }

  reinitialiser(widgetId?: number): void {
    if (!this.estNavigateur) return;
    try {
      if (typeof grecaptcha !== 'undefined') {
        grecaptcha.reset(widgetId);
      }
    } catch (e) {}
  }
}
