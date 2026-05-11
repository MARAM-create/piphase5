import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MeubleService } from '../../../../core/services/meuble.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Meuble } from '../../../../core/models/meuble.model';

@Component({
  selector: 'app-meuble-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './meuble-detail.component.html',
  styleUrls: ['./meuble-detail.component.css']
})
export class MeubleDetailComponent implements OnInit {
  meuble: Meuble | null = null;
  chargement = true;
  erreur = '';
  photoActive = 0;
  utilisateurId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private meubleService: MeubleService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.utilisateurId = this.authService.getSnapshot()?.id ?? null;
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.meubleService.getDetail(id).subscribe({
      next: (data) => {
        this.meuble = data;
        this.chargement = false;
      },
      error: () => {
        this.erreur = 'Meuble introuvable';
        this.chargement = false;
      }
    });
  }

  getPhotoUrl(photo: string): string {
    return this.meubleService.getPhotoUrl(photo);
  }

  estMonMeuble(): boolean {
    return this.utilisateurId === this.meuble?.vendeurId;
  }

  acheter(): void {
    if (!this.meuble) return;

    if (!confirm(`Confirmer l'achat de "${this.meuble.titre}" pour ${this.meuble.prix} DT ?`)) return;

    this.meubleService.acheterMeuble(this.meuble.id).subscribe({
      next: (m) => {
        this.meuble = m;
        alert('Achat confirmé !');
      },
      error: (e) => alert(e.error?.message || 'Erreur')
    });
  }

  getEtatLabel(etat?: string): string {
    if (etat === 'BON_ETAT') return 'Bon état';
    if (etat === 'NEUF') return 'Neuf';
    return 'Usagé';
  }

  getStatutLabel(statut?: string): string {
    if (statut === 'DISPONIBLE') return 'Disponible';
    if (statut === 'VENDU') return 'Vendu';
    return 'Réservé';
  }

  getPhotoActive(): string | null {
    if (!this.meuble?.photos?.length) return null;
    return this.getPhotoUrl(this.meuble.photos[this.photoActive]);
  }
}
