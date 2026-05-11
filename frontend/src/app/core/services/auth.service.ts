import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import {
  Utilisateur, ReponseAuth, Role
} from '../models/utilisateur.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API = `${environment.apiUrl}/api/auth`;
  private _utilisateur$ = new BehaviorSubject<Utilisateur | null>(null);
  private estNavigateur: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.estNavigateur = isPlatformBrowser(this.platformId);

    if (this.estNavigateur) {
      try {
        // ✅ Session persistante — lire depuis localStorage
        const stocke = localStorage.getItem('utilisateur');
        const token = localStorage.getItem('token');

        if (stocke && token) {
          this._utilisateur$.next(JSON.parse(stocke));
          // ✅ Vérifier que le token est encore valide côté serveur
          this.verifierTokenServeur();
        }
      } catch {
        this.viderSession();
      }
    }
  }

  // ✅ Vérifie la validité du token au démarrage
  private verifierTokenServeur(): void {
    this.http.get<Utilisateur>(`${this.API}/verifier-token`).subscribe({
      next: (u: Utilisateur) => {
        // Token valide — mettre à jour les données
        this.stockerLocal('utilisateur', JSON.stringify(u));
        this._utilisateur$.next(u);
      },
      error: () => {
        // Token expiré ou invalide — déconnecter
        this.viderSession();
      }
    });
  }

  inscrire(donnees: any): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API}/inscription`, donnees
    );
  }

  connecter(donnees: any): Observable<ReponseAuth> {
    return this.http.post<ReponseAuth>(`${this.API}/connexion`, donnees)
      .pipe(tap(res => this.sauvegarderSession(res)));
  }

  connexionGoogle(idToken: string): Observable<ReponseAuth> {
    return this.http.post<ReponseAuth>(`${this.API}/google`, { idToken })
      .pipe(tap(res => this.sauvegarderSession(res)));
  }

  oublierMotDePasse(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API}/oublier-mdp`, { email }
    );
  }

  reinitialiserMotDePasse(
    token: string, nouveauMotDePasse: string
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API}/reinitialiser-mdp`, { token, nouveauMotDePasse }
    );
  }

  obtenirProfil(): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.API}/profil`);
  }

  mettreAJourProfil(donnees: Partial<Utilisateur>): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.API}/profil`, donnees).pipe(
      tap(u => {
        const maj = { ...this._utilisateur$.value, ...u } as Utilisateur;
        this.stockerLocal('utilisateur', JSON.stringify(maj));
        this._utilisateur$.next(maj);
      })
    );
  }

  deconnecter(): void {
    this.viderSession();
    this.router.navigate(['/']);
  }

  redirigerSelonRole(): void {
    const routes: Record<string, string> = {
      ETUDIANT: '/accueil-etudiant',
      PROPRIETAIRE: '/accueil-proprietaire',
      PRESTATAIRE: '/accueil-prestataire',
      ADMIN: '/tableau-de-bord/admin'
    };
    const role = this.getRole();
    this.router.navigate([role ? routes[role] : '/']);
  }

  private sauvegarderSession(res: ReponseAuth): void {
    this.stockerLocal('token', res.token);
    this.stockerLocal('utilisateur', JSON.stringify(res.utilisateur));
    this._utilisateur$.next(res.utilisateur);
  }

  private viderSession(): void {
    this.supprimerLocal('token');
    this.supprimerLocal('utilisateur');
    this._utilisateur$.next(null);
  }

  private stockerLocal(cle: string, valeur: string): void {
    if (this.estNavigateur) localStorage.setItem(cle, valeur);
  }

  private supprimerLocal(cle: string): void {
    if (this.estNavigateur) localStorage.removeItem(cle);
  }

  private lireLocal(cle: string): string | null {
    return this.estNavigateur ? localStorage.getItem(cle) : null;
  }

  get utilisateur$(): Observable<Utilisateur | null> {
    return this._utilisateur$.asObservable();
  }

  getSnapshot(): Utilisateur | null { return this._utilisateur$.value; }
  estConnecte(): boolean { return !!this.lireLocal('token'); }
  getRole(): Role | null { return this._utilisateur$.value?.role ?? null; }
  getToken(): string | null { return this.lireLocal('token'); }
  getUserId(): number | null {
  return this._utilisateur$.value?.id ?? null;
}
}
