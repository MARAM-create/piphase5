import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MeubleService } from '../../../../core/services/meuble.service';
import { DemandeServiceService } from '../../../../core/services/demande-service.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Meuble } from '../../../../core/models/meuble.model';
import { DemandeServiceResponse } from '../../../../core/models/demande-service.model';

interface AchatAvecTransport {
  meuble: Meuble;
  demande: DemandeServiceResponse | null;
}

@Component({
  selector: 'app-mes-achats',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mes-achats.component.html',
  styleUrls: ['./mes-achats.component.css']
})
export class MesAchatsComponent implements OnInit {
  achats: AchatAvecTransport[] = [];
  chargement = true;
  erreur = '';

  constructor(
    private meubleService: MeubleService,
    private demandeService: DemandeServiceService
  ) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.meubleService.mesAchats().subscribe({
      next: (meubles) => {
        // Charger les demandes de transport pour chaque meuble
        this.demandeService.mesDemandes().subscribe({
          next: (demandes) => {
            this.achats = meubles.map(meuble => {
              const demande = demandes.find(d =>
                d.probleme?.startsWith('MEUBLE:') &&
                d.probleme?.includes(meuble.titre)
              ) || null;
              return { meuble, demande };
            });
            this.chargement = false;
          },
          error: () => {
            this.achats = meubles.map(m => ({ meuble: m, demande: null }));
            this.chargement = false;
          }
        });
      },
      error: () => {
        this.erreur = 'Erreur lors du chargement';
        this.chargement = false;
      }
    });
  }

  getPhotoUrl(photo: string): string {
    return this.meubleService.getPhotoUrl(photo);
  }

  statutTransportLabel(demande: DemandeServiceResponse | null): string {
    if (!demande) return 'Sans transporteur';
    if (demande.statut === 'EN_ATTENTE') return '⏳ Transport en attente';
    if (demande.statut === 'ACCEPTEE')   return '✅ Transport confirmé';
    return '❌ Transport refusé';
  }

  statutTransportClass(demande: DemandeServiceResponse | null): string {
    if (!demande) return 'sans-transport';
    if (demande.statut === 'EN_ATTENTE') return 'en-attente';
    if (demande.statut === 'ACCEPTEE')   return 'accepte';
    return 'refuse';
  }

  etatLabel(etat: string): string {
    if (etat === 'NEUF')     return 'Neuf';
    if (etat === 'BON_ETAT') return 'Bon état';
    return 'Usagé';
  }
}
