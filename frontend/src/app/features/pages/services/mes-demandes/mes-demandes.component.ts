import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DemandeServiceService } from '../../../../core/services/demande-service.service';
import { DemandeServiceResponse } from '../../../../core/models/demande-service.model';

@Component({
  selector: 'app-mes-demandes',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './mes-demandes.component.html',
  styleUrls: ['./mes-demandes.component.css']
})
export class MesDemandesComponent implements OnInit {
  demandes: DemandeServiceResponse[] = [];
  chargement = true;
  erreur = '';

  // Modal modification
  modalOuvert = false;
  demandeAModifier: DemandeServiceResponse | null = null;
  form!: FormGroup;
  envoi = false;
  erreurEnvoi = '';
  succesEnvoi = false;

  constructor(
    private demandeService: DemandeServiceService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      dateService:  ['', Validators.required],
      heureService: ['', Validators.required],
      probleme:     ['', Validators.required],
      adresse:      ['', Validators.required],
      ville:        ['', Validators.required]
    });
    this.charger();
  }

  charger(): void {
    this.chargement = true;
    this.demandeService.mesDemandes().subscribe({
      next: (data) => { this.demandes = data; this.chargement = false; },
      error: () => { this.erreur = 'Erreur de chargement'; this.chargement = false; }
    });
  }

  ouvrirModification(d: DemandeServiceResponse): void {
    this.demandeAModifier = d;
    this.modalOuvert = true;
    this.erreurEnvoi = '';
    this.succesEnvoi = false;
    this.form.patchValue({
      dateService:  d.dateService,
      heureService: d.heureService,
      probleme:     d.probleme,
      adresse:      d.adresse,
      ville:        d.ville
    });
  }

  fermerModal(): void {
    this.modalOuvert = false;
    this.demandeAModifier = null;
  }

  modifier(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.demandeAModifier) return;

    this.envoi = true;
    this.erreurEnvoi = '';

    const data = {
      prestataireId: this.demandeAModifier.prestataireId,
      ...this.form.value
    };

    this.demandeService.modifierDemande(this.demandeAModifier.id, data).subscribe({
      next: (updated: DemandeServiceResponse) => {
        const idx = this.demandes.findIndex(d => d.id === updated.id);
        if (idx !== -1) this.demandes[idx] = updated;
        this.succesEnvoi = true;
        this.envoi = false;
        setTimeout(() => this.fermerModal(), 1500);
      },
      error: (e: any) => {
        this.erreurEnvoi = e.error?.message || 'Erreur lors de la modification';
        this.envoi = false;
      }
    });
  }

  statutLabel(statut: string): string {
    if (statut === 'EN_ATTENTE') return '⏳ En attente';
    if (statut === 'ACCEPTEE')   return '✅ Acceptée';
    return '❌ Refusée';
  }

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }

  get f() { return this.form.controls; }
}
