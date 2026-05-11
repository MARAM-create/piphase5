import { Component, inject, HostListener,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MiniMessengerComponent } from '../../features/mini-messenger/mini-messenger.component';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule , MiniMessengerComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  public authService = inject(AuthService);
  utilisateur$ = this.authService.utilisateur$;
  menuOuvert = false;
  monEspaceOuvert = false;
  reclamationOuvert = false;
  contratOuvert = false;

  private http = inject(HttpClient);
  private API = environment.apiUrl + '/api';

  nombreMessagesNonLus = 0;
  private refreshMessagesInterval: any;


  ngOnInit(): void {
    this.chargerNombreMessagesNonLus();

    this.refreshMessagesInterval = setInterval(() => {
      this.chargerNombreMessagesNonLus();
    }, 10000);
  }
  ngOnDestroy(): void {
    if (this.refreshMessagesInterval) {
      clearInterval(this.refreshMessagesInterval);
    }
  }
  getInitials(nom?: string, prenom?: string): string {
    if (!prenom || !nom) return 'U';
    return (prenom[0] + nom[0]).toUpperCase();
  }

   fermerTousLesMenus(): void {
    this.menuOuvert = false;
    this.monEspaceOuvert = false;
    this.reclamationOuvert = false;
    this.contratOuvert = false;
  }

  toggleMenu(event?: Event): void {
    event?.stopPropagation();
    const etat = this.menuOuvert;
    this.fermerTousLesMenus();
    this.menuOuvert = !etat;
    console.log('Menu toggled:', this.menuOuvert);
  }

  toggleMonEspace(event?: Event): void {
    event?.stopPropagation();
    const etat = this.monEspaceOuvert;
    this.fermerTousLesMenus();
    this.monEspaceOuvert = !etat;
    console.log('Mon Espace toggled:', this.monEspaceOuvert);
  }

  toggleReclamation(event?: Event): void {
    event?.stopPropagation();
    const etat = this.reclamationOuvert;
    this.fermerTousLesMenus();
    this.reclamationOuvert = !etat;
  }

  toggleContrat(event?: Event): void {
    event?.stopPropagation();
    const etat = this.contratOuvert;
    this.fermerTousLesMenus();
    this.contratOuvert = !etat;
  }



  deconnecter(): void {
    this.fermerTousLesMenus();
    this.authService.deconnecter();
  }

  getDashboardRoute(): string {
    const role = this.authService.getRole();
    const routes: Record<string, string> = {
      'ETUDIANT': '/tableau-de-bord/etudiant',
      'PROPRIETAIRE': '/tableau-de-bord/proprietaire',
      'PRESTATAIRE': '/tableau-de-bord/prestataire',
      'ADMIN': '/tableau-de-bord/admin'
    };
    return routes[role || ''] || '/tableau-de-bord/etudiant';
  }

  getContratsRoute(): string {
    const role = this.authService.getRole();
    if (role === 'PROPRIETAIRE') return '/tableau-de-bord/proprietaire/contrats';
    return '/tableau-de-bord/etudiant/contrats';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isInsideMenu = target.closest('.user-menu-container') ||
      target.closest('.dropdown-menu') ||
      target.closest('.mon-espace-container') ||
      target.closest('.reclamation-menu-container') ||
      target.closest('.contrat-menu-container');

    if (!isInsideMenu) {
      this.fermerTousLesMenus();
    }
  }


  miniMessengerOuvert = false;


  chargerNombreMessagesNonLus(): void {
    const raw = localStorage.getItem('utilisateur');

    if (!raw) {
      this.nombreMessagesNonLus = 0;
      return;
    }

    const utilisateur = JSON.parse(raw);

    if (!utilisateur?.id) {
      this.nombreMessagesNonLus = 0;
      return;
    }

    this.http.get<any>(`${this.API}/messages/nonlus/count/${utilisateur.id}`).subscribe({
      next: (res) => {
        this.nombreMessagesNonLus = res?.count || 0;
      },
      error: () => {
        this.nombreMessagesNonLus = 0;
      }
    });
  }
  toggleMiniMessenger(): void {
    this.miniMessengerOuvert = !this.miniMessengerOuvert;
    this.chargerNombreMessagesNonLus();
  }
  fermerMiniMessenger(): void {
    this.miniMessengerOuvert = false;
    this.chargerNombreMessagesNonLus();
  }
}
