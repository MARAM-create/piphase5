import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="relative bg-[#061911] text-white pt-14 pb-8 border-t border-[#d9a755]/20">
      <!-- Soft top glow -->
      <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d9a755]/70 to-transparent"></div>

      <div class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          
          <!-- Brand -->
          <div>
            <h3 class="text-3xl font-serif font-bold text-[#d9a755] mb-3">
              Locavia
            </h3>
            <p class="text-sm text-white/75 leading-relaxed max-w-sm">
              Trouvez votre location ou colocation idéale en Tunisie avec des annonces vérifiées et une expérience simple.
            </p>

            <div class="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full bg-[#0b2419] border border-[#d9a755]/25 text-xs font-bold tracking-[0.18em] uppercase text-white/85">
              <span class="w-2 h-2 rounded-full bg-[#d9a755]"></span>
              Logements vérifiés
            </div>
          </div>

          <!-- Links -->
          <div>
            <h4 class="text-white font-bold mb-4 tracking-wide">
              Liens rapides
            </h4>
            <ul class="space-y-3 text-sm">
              <li>
                <a href="#" class="text-white/70 hover:text-[#d9a755] transition">
                  Annonces
                </a>
              </li>
              <li>
                <a href="#" class="text-white/70 hover:text-[#d9a755] transition">
                  À propos
                </a>
              </li>
              <li>
                <a href="#" class="text-white/70 hover:text-[#d9a755] transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <!-- Legal -->
          <div>
            <h4 class="text-white font-bold mb-4 tracking-wide">
              Légal
            </h4>
            <ul class="space-y-3 text-sm">
              <li>
                <a href="#" class="text-white/70 hover:text-[#d9a755] transition">
                  Conditions d'utilisation
                </a>
              </li>
              <li>
                <a href="#" class="text-white/70 hover:text-[#d9a755] transition">
                  Politique de confidentialité
                </a>
              </li>
              <li>
                <a href="#" class="text-white/70 hover:text-[#d9a755] transition">
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div class="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/55">
          <p>&copy; 2026 Locavia. Tous droits réservés.</p>

          <p class="text-[#d9a755]/80 font-medium">
            Location • Colocation • Matching
          </p>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {}
