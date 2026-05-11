import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <a routerLink="/" class="logo">🏠 Locavia</a>
        <span class="badge">AI-Powered</span>
      </div>
      <div class="navbar-links">
        <a routerLink="/dashboard-reclamation" routerLinkActive="active">📊 Dashboard</a>
        <a routerLink="/avis" routerLinkActive="active">⭐ Avis</a>
        <a routerLink="/reclamations" routerLinkActive="active">📬 Réclamations</a>
        <a routerLink="/chat" routerLinkActive="active">🤖 Chat IA</a>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: linear-gradient(135deg, #1e3a5f 0%, #2d5986 100%);
      padding: 0 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .logo {
      color: white;
      font-size: 1.4rem;
      font-weight: 700;
      text-decoration: none;
    }
    .badge {
      background: linear-gradient(135deg, #f59e0b, #f97316);
      color: white;
      font-size: 0.65rem;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .navbar-links {
      display: flex;
      gap: 0.5rem;
    }
    .navbar-links a {
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.9rem;
      transition: all 0.2s;
    }
    .navbar-links a:hover {
      background: rgba(255,255,255,0.15);
      color: white;
    }
    .navbar-links a.active {
      background: rgba(255,255,255,0.2);
      color: white;
      font-weight: 600;
    }
  `]
})
export class NavbarComponent {}
