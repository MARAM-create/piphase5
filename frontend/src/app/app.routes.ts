import { Routes } from '@angular/router';
import { HomeComponent } from './features/pages/accueil/accueil.component'

import { VerifierOtpComponent } from './features/pages/auth/verifier-otp/verifier-otp.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { QuestionnaireComponent } from './features/matching/questionnaire/questionnaire.component';
import { ColocatairesMatchingComponent } from './features/matching/colocataires-matching/colocataires-matching.component';
import { AvisListComponent } from './features/reclamation/avis-list/avis-list.component';
import { ReclamationListComponent } from './features/reclamation/reclamation-list/reclamation-list.component';
import { ChatComponent } from './features/reclamation/chat/chat.component';

import { DashboardReclamationComponent } from './features/reclamation/dashboard-reclamation/dashboard-reclamation.component';

import { VerificationComponent } from './features/pages/verification/verification.component';



export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/pages/accueil/accueil.component')
        .then(m => m.HomeComponent)
  },
  {
    path: 'connexion',
    loadComponent: () =>
      import('./features/pages/auth/connexion/connexion.component')
        .then(m => m.ConnexionComponent)
  },
  {
    path: 'demande-location/:id',
    loadComponent: () =>
      import('./features/demande-location/demande-location.component')
        .then(m => m.DemandeLocationComponent)
  },
  {
    path: 'inscription',
    loadComponent: () =>
      import('./features/pages/auth/inscription/inscription.component')
        .then(m => m.InscriptionComponent)
  },
  {
    path: 'verifier-email',
    loadComponent: () =>
      import('./features/pages/auth/verifier-email/verifier-email.component')
        .then(m => m.VerifierEmailComponent)
  },
  {
    path: 'oublier-mdp',
    loadComponent: () =>
      import('./features/pages/auth/oublier-mdp/oublier-mdp.component')
        .then(m => m.OublierMdpComponent)
  },
  {
    path: 'reinitialiser-mdp',
    loadComponent: () =>
      import('./features/pages/auth/reinitialiser-mdp/reinitialiser-mdp.component')
        .then(m => m.ReinitialiserMdpComponent)
  },
  // Route pour la gestion des contrats (Propriétaire)
  {
    path: 'tableau-de-bord/proprietaire/contrats',
    canActivate: [authGuard, roleGuard('PROPRIETAIRE')],
    loadComponent: () =>
      import('./features/contrats/contract-management/contract-management.component')
        .then(m => m.ContractManagementComponent)
  },

  // Route pour la liste des contrats (Étudiant)
  {
    path: 'tableau-de-bord/etudiant/contrats',
    canActivate: [authGuard, roleGuard('ETUDIANT')],
    loadComponent: () =>
      import('./features/contrats/liste-contrats/liste-contrats.component')
        .then(m => m.ListeContratsComponent)
  },
  {
    path: 'tableau-de-bord/admin',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/pages/tableaux-de-bord/admin/admin-shell/admin-shell.component')
        .then(m => m.AdminShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/pages/tableaux-de-bord/admin/admin.component')
            .then(m => m.AdminComponent)
      },
      {
        path: 'contrats',
        loadComponent: () =>
          import('./features/pages/tableaux-de-bord/admin/admin-contrats/admin-contrats.component')
            .then(m => m.AdminContratsComponent)
      },
      {
        path: 'paiements',
        loadComponent: () =>
          import('./features/pages/tableaux-de-bord/admin/admin-paiements/admin-paiements.component')
            .then(m => m.AdminPaiementsComponent)
      }
    ]
  },
  {
    path: 'accueil-etudiant',
    canActivate: [authGuard, roleGuard('ETUDIANT')],
    loadComponent: () =>
      import('./features/pages/etudiant-home/etudiant-home.component')
        .then(m => m.EtudiantHomeComponent)
  },
  {
    path: 'tableau-de-bord/etudiant',
    canActivate: [authGuard, roleGuard('ETUDIANT')],
    loadComponent: () =>
      import('./features/pages/tableaux-de-bord/etudiant/etudiant.component')
        .then(m => m.EtudiantComponent)
  },
  {
    path: 'accueil-proprietaire',
    canActivate: [authGuard, roleGuard('PROPRIETAIRE')],
    loadComponent: () =>
      import('./features/pages/proprietaire-home/proprietaire-home.component')
        .then(m => m.ProprietaireHomeComponent)
  },
  {
    path: 'tableau-de-bord/proprietaire',
    canActivate: [authGuard, roleGuard('PROPRIETAIRE')],
    loadComponent: () =>
      import('./features/pages/tableaux-de-bord/proprietaire/proprietaire.component')
        .then(m => m.ProprietaireComponent)
  },

  // Meubles — accessible à tous les connectés
  {
    path: 'meubles',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pages/meubles/meuble-liste/meuble-liste.component')
        .then(m => m.MeubleListeComponent)
  },
  {
    path: 'meubles/publier',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pages/meubles/meuble-form/meuble-form.component')
        .then(m => m.MeubleFormComponent)
  },
  {
    path: 'meubles/mes-meubles',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pages/meubles/mes-meubles/mes-meubles.component')
        .then(m => m.MesMeublesComponent)
  },
  {
    path: 'meubles/modifier/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pages/meubles/meuble-form/meuble-form.component')
        .then(m => m.MeubleFormComponent)
  },
  {
    path: 'meubles/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pages/meubles/meuble-detail/meuble-detail.component')
        .then(m => m.MeubleDetailComponent)
  },
  {
    path: 'accueil-prestataire',
    canActivate: [authGuard, roleGuard('PRESTATAIRE')],
    loadComponent: () =>
      import('./features/pages/prestataire-home/prestataire-home.component')
        .then(m => m.PrestataireHomeComponent)
  },
  {
    path: 'tableau-de-bord/prestataire',
    canActivate: [authGuard, roleGuard('PRESTATAIRE')],
    loadComponent: () =>
      import('./features/pages/tableaux-de-bord/prestataire/prestataire.component')
        .then(m => m.PrestataireComponent)
  },
  {
    path: 'verifier-otp',
    component: VerifierOtpComponent
  },
  // ✅ Annonces routes added here using loadChildren
  {
    path: 'annonces',
    loadChildren: () =>
      import('./features/yassine/annonces/annonces.routes')
        .then(m => m.ANNONCE_ROUTES)
  },
  {
    path: 'visite-en-ligne',
    loadComponent: () =>
      import('./features/visite-en-ligne/visite-en-ligne.component')
        .then(m => m.VisiteEnLigneComponent)
  },
  // ✅ Colocataires (Roommate Matching) routes
  {
    path: 'colocataires/questionnaire',
    component: QuestionnaireComponent,
    canActivate: [authGuard, roleGuard('ETUDIANT')]
  },
  {
    path: 'colocataires/matches',
    component: ColocatairesMatchingComponent,
    canActivate: [authGuard, roleGuard('ETUDIANT')]
  },
  {
    path: 'colocataires',
    redirectTo: 'colocataires/matches',
    pathMatch: 'full'
  },
  { path: 'dashboard-reclamation', component: DashboardReclamationComponent },
  { path: 'avis', component: AvisListComponent },
  { path: 'reclamations', component: ReclamationListComponent },
  { path: 'chat', component: ChatComponent },
  {
    path: 'services',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pages/services/services-liste/services-liste.component')
        .then(m => m.ServicesListeComponent)
  },
  {
    path: 'services/prestataire',
    canActivate: [authGuard, roleGuard('PRESTATAIRE')],
    loadComponent: () =>
      import('./features/pages/services/services-prestataire/services-prestataire.component')
        .then(m => m.ServicesPrestataireComponent)
  },
  {
    path: 'services/mes-demandes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pages/services/mes-demandes/mes-demandes.component')
        .then(m => m.MesDemandesComponent)
  },
  {
    path: 'services/demandes/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pages/services/demande-detail/demande-detail.component')
        .then(m => m.DemandeDetailComponent)
  },

  {
    path: 'mes-achats',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pages/meubles/mes-achats/mes-achats.component')
        .then(m => m.MesAchatsComponent)
  },

  {
    path: 'verification/:numero',
    component: VerificationComponent
  },
  //visites 3d
  {
    path: 'create-visite-3d',
    loadComponent: () =>
      import('./features/visite360/create-visite/create-visite.component')
        .then(m => m.CreateVisiteComponent)
  },
  {
    path: 'messagerie',
    loadComponent: () =>
      import('./features/messagerie/messagerie.component')
        .then(m => m.MessagerieComponent)
  },
  {
  path: 'mes-annonces',
  canActivate: [authGuard, roleGuard('PROPRIETAIRE')],
  loadComponent: () =>
    import('../app/features/yassine/annonces/espace proprietaire/mesannoncesproprietaire.component')
      .then(m => m.MesAnnoncesProprietaireComponent)
},
];

