import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReclamationService } from '../../../core/services/reclamation.service';
import { Reclamation } from '../../../core/models/reclamation.model';

@Component({
  selector: 'app-reclamation-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>📬 Gestion des Réclamations</h1>
        <button class="btn-primary" (click)="showForm = !showForm">
          {{ showForm ? '✕ Fermer' : '+ Nouvelle Réclamation' }}
        </button>
      </div>

      <!-- Create Form -->
      <div class="form-card" *ngIf="showForm">
        <h3>{{ editingId ? 'Modifier' : 'Créer' }} une réclamation</h3>
        <div class="form-group">
          <label>Titre</label>
          <input [(ngModel)]="formData.titre" placeholder="Titre de la réclamation" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea [(ngModel)]="formData.description" rows="4"
            placeholder="Décrivez votre problème en détail..."></textarea>
        </div>
        <div class="form-group">
          <label>Type</label>
          <select [(ngModel)]="formData.type">
            <option value="TECHNICAL">🔧 Technique</option>
            <option value="SERVICE">🛎️ Service</option>
            <option value="BILLING">💳 Facturation</option>
            <option value="PAYMENT">💰 Paiement</option>
            <option value="CLEANLINESS">🧹 Propreté</option>
            <option value="OWNER">🏠 Propriétaire</option>
            <option value="FRAUD">🚨 Fraude</option>
            <option value="OTHER">📋 Autre</option>
          </select>
        </div>
        <div class="form-group">
          <label>📧 Votre email <span class="hint">(pour recevoir les notifications)</span></label>
          <input [(ngModel)]="formData.email" type="email" placeholder="exemple@email.com" />
        </div>
        <div class="ai-info" *ngIf="!editingId">
          🤖 La priorité et la catégorie seront détectées automatiquement par l'IA
        </div>
        <div class="form-actions">
          <button class="btn-primary" (click)="save()">💾 Sauvegarder</button>
          <button class="btn-secondary" (click)="cancel()">Annuler</button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <select [(ngModel)]="filterPriority" (change)="applyFilter()">
          <option value="">Toutes priorités</option>
          <option value="HIGH">🚨 Haute</option>
          <option value="MEDIUM">⚠️ Moyenne</option>
          <option value="LOW">✅ Basse</option>
        </select>
        <select [(ngModel)]="filterStatus" (change)="applyFilter()">
          <option value="">Tous statuts</option>
          <option value="PENDING">En attente</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="RESOLVED">Résolu</option>
          <option value="REJECTED">Rejeté</option>
        </select>
      </div>

      <!-- Reclamation List -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Titre</th>
              <th>Type</th>
              <th>Catégorie (IA)</th>
              <th>Priorité (IA)</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of filteredReclamations">
              <td>#{{ r.id }}</td>
              <td>
                <strong>{{ r.titre }}</strong>
                <p class="desc-preview">{{ r.description | slice:0:60 }}{{ r.description && r.description.length > 60 ? '...' : '' }}</p>
                <p class="email-preview" *ngIf="r.email">📧 {{ r.email }}</p>
              </td>
              <td><span class="type-badge">{{ r.type }}</span></td>
              <td><span class="category-badge">{{ r.category || 'N/A' }}</span></td>
              <td>
                <span class="priority-badge" [ngClass]="'priority-' + (r.priority || 'LOW').toLowerCase()">
                  {{ getPriorityIcon(r.priority) }} {{ r.priority || 'LOW' }}
                </span>
              </td>
              <td>
                <span class="status-badge" [ngClass]="'status-' + (r.status || 'PENDING').toLowerCase().replace('_', '-')">
                  {{ r.status }}
                </span>
              </td>
              <td>{{ r.createdAt | date:'dd/MM/yyyy' }}</td>
              <td>
                <button class="btn-sm btn-edit" (click)="edit(r)">✏️</button>
                <button class="btn-sm btn-delete" (click)="deleteReclamation(r.id!)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="filteredReclamations.length === 0" class="empty-state">
        <p>Aucune réclamation trouvée.</p>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    h1 { color: #1e3a5f; font-size: 1.8rem; }
    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white; border: none; padding: 0.6rem 1.2rem;
      border-radius: 8px; cursor: pointer; font-weight: 600;
    }
    .btn-secondary {
      background: #e2e8f0; color: #475569; border: none;
      padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer;
    }
    .form-card {
      background: white; border-radius: 16px; padding: 1.5rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08); margin-bottom: 1.5rem;
    }
    .form-card h3 { color: #1e3a5f; margin-bottom: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.3rem; color: #475569; font-weight: 500; }
    .form-group input, .form-group textarea, .form-group select {
      width: 100%; padding: 0.6rem; border: 1px solid #d1d5db;
      border-radius: 8px; font-size: 0.9rem; box-sizing: border-box;
    }
    .ai-info {
      background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af;
      padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem;
    }
    .form-actions { display: flex; gap: 0.5rem; }
    .filter-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .filter-bar select {
      padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 8px; background: white;
    }
    .table-container { overflow-x: auto; }
    table {
      width: 100%; border-collapse: collapse; background: white;
      border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    thead { background: #f8fafc; }
    th {
      padding: 0.8rem 1rem; text-align: left; color: #475569;
      font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;
    }
    td { padding: 0.8rem 1rem; border-top: 1px solid #f1f5f9; font-size: 0.9rem; }
    .desc-preview { color: #94a3b8; font-size: 0.8rem; margin: 0.2rem 0 0; }
    .email-preview { color: #3b82f6; font-size: 0.75rem; margin: 0.1rem 0 0; }
    .hint { color: #94a3b8; font-weight: 400; font-size: 0.8rem; }
    .type-badge {
      background: #e0f2fe; color: #0369a1; padding: 2px 8px;
      border-radius: 8px; font-size: 0.75rem; font-weight: 600;
    }
    .category-badge {
      background: #f3e8ff; color: #7c3aed; padding: 2px 8px;
      border-radius: 8px; font-size: 0.75rem; font-weight: 600;
    }
    .priority-badge {
      padding: 2px 8px; border-radius: 8px; font-size: 0.75rem; font-weight: 600;
    }
    .priority-high { background: #fee2e2; color: #991b1b; }
    .priority-medium { background: #fef3c7; color: #92400e; }
    .priority-low { background: #dcfce7; color: #166534; }
    .status-badge {
      padding: 2px 8px; border-radius: 8px; font-size: 0.75rem; font-weight: 600;
    }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-in-progress { background: #dbeafe; color: #1e40af; }
    .status-resolved { background: #dcfce7; color: #166534; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .btn-sm {
      padding: 0.3rem 0.5rem; border: none; border-radius: 6px;
      cursor: pointer; font-size: 0.8rem; margin-right: 0.25rem;
    }
    .btn-edit { background: #e0f2fe; }
    .btn-delete { background: #fee2e2; }
    .empty-state { text-align: center; padding: 3rem; color: #94a3b8; }
  `]
})
export class ReclamationListComponent implements OnInit {
  reclamations: Reclamation[] = [];
  filteredReclamations: Reclamation[] = [];
  showForm = false;
  editingId: number | null = null;
  formData: Reclamation = { titre: '', description: '', type: 'OTHER' };
  filterPriority = '';
  filterStatus = '';

  constructor(private reclamationService: ReclamationService) {}

  ngOnInit(): void {
    this.loadReclamations();
  }

  loadReclamations(): void {
    this.reclamationService.getAll().subscribe(data => {
      this.reclamations = data;
      this.applyFilter();
    });
  }

  applyFilter(): void {
    this.filteredReclamations = this.reclamations.filter(r => {
      if (this.filterPriority && r.priority !== this.filterPriority) return false;
      if (this.filterStatus && r.status !== this.filterStatus) return false;
      return true;
    });
  }

  getPriorityIcon(priority?: string): string {
    switch (priority) {
      case 'HIGH': return '🚨';
      case 'MEDIUM': return '⚠️';
      default: return '✅';
    }
  }

  save(): void {
    if (this.editingId) {
      this.reclamationService.update(this.editingId, this.formData).subscribe(() => {
        this.loadReclamations();
        this.cancel();
      });
    } else {
      this.reclamationService.create(this.formData).subscribe(() => {
        this.loadReclamations();
        this.cancel();
      });
    }
  }

  edit(r: Reclamation): void {
    this.editingId = r.id!;
    this.formData = { ...r };
    this.showForm = true;
  }

  deleteReclamation(id: number): void {
    if (confirm('Supprimer cette réclamation ?')) {
      this.reclamationService.delete(id).subscribe(() => this.loadReclamations());
    }
  }

  cancel(): void {
    this.showForm = false;
    this.editingId = null;
    this.formData = { titre: '', description: '', type: 'OTHER', email: '' };
  }
}
