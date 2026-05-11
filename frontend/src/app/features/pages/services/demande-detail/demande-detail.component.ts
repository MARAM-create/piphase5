import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DemandeServiceService } from '../../../../core/services/demande-service.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DemandeServiceResponse } from '../../../../core/models/demande-service.model';

@Component({
  selector: 'app-demande-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './demande-detail.component.html',
  styleUrls: ['./demande-detail.component.css']
})
export class DemandeDetailComponent implements OnInit {
  demande: DemandeServiceResponse | null = null;
  chargement = true;
  traitement = false;
  erreur = '';
  succes = '';
  utilisateurId: number | null = null;
  estPrestataire = false;

  constructor(
    private route: ActivatedRoute,
    private demandeService: DemandeServiceService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const u = this.authService.getSnapshot();
    this.utilisateurId = u?.id ?? null;
    this.estPrestataire = u?.role === 'PRESTATAIRE';

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.demandeService.getDetail(id).subscribe({
      next: (d) => { this.demande = d; this.chargement = false; },
      error: () => {
        this.erreur = 'Demande introuvable ou accès refusé';
        this.chargement = false;
      }
    });
  }

  // Vérifier si l'utilisateur connecté est LE prestataire de cette demande
  estMonPrestataire(): boolean {
    return this.estPrestataire
      && !!this.demande
      && this.demande.prestataireId === this.utilisateurId;
  }

  accepter(): void {
    if (!this.demande) return;
    this.traitement = true;
    this.succes = '';
    this.erreur = '';

    this.demandeService.accepter(this.demande.id).subscribe({
      next: (d) => {
        this.demande = d;
        this.succes = '✅ Demande acceptée avec succès !';
        this.traitement = false;
      },
      error: (e: any) => {
        this.erreur = e.error?.message || 'Erreur lors de l\'acceptation';
        this.traitement = false;
      }
    });
  }

  refuser(): void {
    if (!this.demande) return;
    this.traitement = true;
    this.succes = '';
    this.erreur = '';

    this.demandeService.refuser(this.demande.id).subscribe({
      next: (d) => {
        this.demande = d;
        this.succes = '❌ Demande refusée.';
        this.traitement = false;
      },
      error: (e: any) => {
        this.erreur = e.error?.message || 'Erreur lors du refus';
        this.traitement = false;
      }
    });
  }
}
