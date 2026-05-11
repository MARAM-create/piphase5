import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AppelService } from './core/services/appel.service';
import { AppelComponent } from './shared/appel/appel.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CommonModule, AppelComponent], // ← ajout AppelComponent
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {


  private router     = inject(Router);
  private appelService = inject(AppelService);
  private authService  = inject(AuthService);

  afficherNavbar = true;
  private routesSansNavbar = [
    '/connexion', '/inscription', '/oublier-mdp',
    '/reinitialiser-mdp', '/verifier-otp', '/verifier-email',
    '/tableau-de-bord/admin'
  ];


  ngOnInit(): void {
    // Navbar
    this.mettreAJourNavbar(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => this.mettreAJourNavbar(e.url));

    // Appel WebSocket
    this.authService.utilisateur$.subscribe(u => {
      if (u) {
        const token = localStorage.getItem('token') || '';
        this.appelService.connecter(u.email, u.prenom + ' ' + u.nom, token);
      } else {
        this.appelService.deconnecter();
      }
    });
  }

  ngOnDestroy(): void {
    this.appelService.deconnecter();
  }

  private mettreAJourNavbar(url: string): void {
    this.afficherNavbar = !this.routesSansNavbar.some(route => url.includes(route));
  }
}
