import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
// AJOUT D'UN ../ SUPPLEMENTAIRE ICI
import { AuthService } from '../../../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
// AJOUT D'UN ../ SUPPLEMENTAIRE ICI
import { environment } from '../../../../../../environments/environment';

interface NavItem {
  cle: string;
  libelle: string;
  icone: string;
  route: string;
  queryParams?: Record<string, string>;
  badge?: () => number;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
  <div class="flex min-h-screen" style="background:var(--cream)">

    <aside class="w-64 min-w-[256px] flex flex-col"
           style="background:var(--forest);box-shadow:4px 0 24px rgba(28,61,42,0.3);
                  position:sticky;top:0;height:100vh;overflow-y:auto;z-index:40">

      <div class="p-6 border-b border-white/10">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl"
               style="background:linear-gradient(135deg,var(--green),var(--green-lt))">🏠</div>
          <span class="text-white font-bold text-xl tracking-tight" style="font-family:var(--font-heading)">
            Locavia
          </span>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center
                      font-black text-sm flex-shrink-0"
               style="background:linear-gradient(135deg,var(--gold),var(--gold-lt));color:var(--forest)">
            {{utilisateur?.prenom?.[0]}}{{utilisateur?.nom?.[0]}}
          </div>
          <div class="min-w-0">
            <p class="text-white text-sm font-bold truncate">
              {{utilisateur?.prenom}} {{utilisateur?.nom}}
            </p>
            <span class="text-xs px-2 py-0.5 rounded-full"
                  style="background:rgba(184,146,42,0.25);color:var(--gold-lt)">
              Administrateur
            </span>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <p class="text-white/50 text-xs font-bold uppercase tracking-widest px-4 mb-2 mt-2">
          Menu principal
        </p>

        <button *ngFor="let item of navItems"
          (click)="naviguer(item)"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                 text-sm font-semibold transition-all text-left"
          [style.background]="isActive(item) ? 'rgba(255,255,255,0.18)' : 'transparent'"
          [style.color]="isActive(item) ? '#ffffff' : 'rgba(255,255,255,0.65)'"
          [style.border-left]="isActive(item) ? '3px solid var(--gold-lt)' : '3px solid transparent'">
          <span class="text-lg">{{item.icone}}</span>
          <span class="flex-1">{{item.libelle}}</span>
          <span *ngIf="item.cle === 'en-attente' && enAttenteBadge > 0"
            class="text-white text-xs font-black rounded-full min-w-[20px] h-5 px-1.5
                   flex items-center justify-center"
            style="background:var(--gold)">
            {{enAttenteBadge}}
          </span>
          <span *ngIf="isActive(item)" class="text-white/70 text-base">›</span>
        </button>

        <div class="border-t border-white/10 my-3"></div>

        <p class="text-white/50 text-xs font-bold uppercase tracking-widest px-4 mb-2">
          Gestion financière
        </p>

        <button *ngFor="let item of financeItems"
          (click)="naviguer(item)"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                 text-sm font-semibold transition-all text-left"
          [style.background]="isActive(item) ? 'rgba(255,255,255,0.18)' : 'transparent'"
          [style.color]="isActive(item) ? '#ffffff' : 'rgba(255,255,255,0.65)'"
          [style.border-left]="isActive(item) ? '3px solid var(--gold-lt)' : '3px solid transparent'">
          <span class="text-lg">{{item.icone}}</span>
          <span class="flex-1">{{item.libelle}}</span>
          <span *ngIf="isActive(item)" class="text-white/70 text-base">›</span>
        </button>

      </nav>

      <div class="p-4 border-t border-white/10">
        <button (click)="logout()"
          class="w-full flex items-center gap-3 text-white/60
                 hover:text-red-400 text-sm py-2.5 px-4 rounded-xl
                 hover:bg-white/5 transition font-medium">
          🚪 Déconnexion
        </button>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0" style="min-height:100vh">
      <router-outlet></router-outlet>
    </div>

  </div>
  `
})
export class AdminShellComponent implements OnInit {

  private router = inject(Router);
  public authService = inject(AuthService);
  private http = inject(HttpClient);

  utilisateur: any = null;
  enAttenteBadge = 0;
  currentUrl = '';

  navItems: NavItem[] = [
    { cle: 'apercu', libelle: 'Tableau de bord', icone: '📊', route: '/tableau-de-bord/admin' },
    { cle: 'en-attente', libelle: 'À approuver', icone: '⏳', route: '/tableau-de-bord/admin', queryParams: { onglet: 'en-attente' } },
    { cle: 'utilisateurs', libelle: 'Utilisateurs', icone: '👥', route: '/tableau-de-bord/admin', queryParams: { onglet: 'utilisateurs' } },
    { cle: 'annonces', libelle: 'Annonces', icone: '🏠', route: '/tableau-de-bord/admin', queryParams: { onglet: 'annonces' } },
    { cle: 'services', libelle: 'Services', icone: '🔧', route: '/tableau-de-bord/admin', queryParams: { onglet: 'services' } },
    { cle: 'reclamations', libelle: 'Réclamations', icone: '📋', route: '/tableau-de-bord/admin', queryParams: { onglet: 'reclamations' } },
  ];

  financeItems: NavItem[] = [
    { cle: 'contrats', libelle: 'Gestion des Contrats', icone: '📄', route: '/tableau-de-bord/admin/contrats' },
    { cle: 'paiements', libelle: 'Suivi des Paiements', icone: '💳', route: '/tableau-de-bord/admin/paiements' },
  ];

  ngOnInit(): void {
    // Utilisation de l'observable pour éviter l'erreur de type 'unknown'
    this.authService.utilisateur$.subscribe(user => {
      this.utilisateur = user;
    });

    this.currentUrl = this.router.url;

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.currentUrl = e.urlAfterRedirects;
      });

    this.http.get<any>(`${environment.apiUrl}/api/admin/statistiques`).subscribe({
      next: (s) => { this.enAttenteBadge = s?.enAttente ?? 0; },
      error: () => { }
    });
  }

  naviguer(item: NavItem): void {
    if (item.queryParams) {
      this.router.navigate([item.route], { queryParams: item.queryParams });
    } else {
      this.router.navigate([item.route]);
    }
  }

  // Méthode de déconnexion pour le template
  logout(): void {
    this.authService.deconnecter();
  }

  isActive(item: NavItem): boolean {
    const url = this.currentUrl.split('?')[0];
    if (item.cle === 'contrats') return url.endsWith('/contrats');
    if (item.cle === 'paiements') return url.endsWith('/paiements');
    if (!url.endsWith('/tableau-de-bord/admin')) return false;
    if (item.cle === 'apercu') {
      const params = this.currentUrl.includes('onglet=') ? this.currentUrl.split('onglet=')[1]?.split('&')[0] : null;
      return !params || params === 'apercu';
    }
    return this.currentUrl.includes(`onglet=${item.cle}`);
  }
}
