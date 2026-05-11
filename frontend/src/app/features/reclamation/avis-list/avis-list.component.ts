import { Component, OnInit, Output, EventEmitter } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvisService } from '../../../core/services/avis.service';
import { Avis } from '../../../core/models/avis.model';

@Component({
  selector: 'app-avis-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>⭐ Gestion des Avis</h1>
        <button class="btn-primary" (click)="showForm = !showForm">
          {{ showForm ? '✕ Fermer' : '+ Nouvel Avis' }}
        </button>
      </div>

      <!-- Create Form -->
      <div class="form-card" *ngIf="showForm">
        <h3>{{ editingId ? 'Modifier' : 'Créer' }} un avis</h3>
        <div class="form-group">
          <label>Titre</label>
          <input [(ngModel)]="formData.titre" placeholder="Titre de l'avis" />
        </div>
        <div class="form-group">
          <label>Commentaire</label>
          <textarea [(ngModel)]="formData.commentaire" rows="3" placeholder="Votre commentaire..."></textarea>
        </div>
        <div class="form-group">
          <label>Note (1-5)</label>
          <div class="star-rating">
            <span *ngFor="let s of [1,2,3,4,5]"
              class="star" [class.active]="s <= formData.rating"
              (click)="formData.rating = s">★</span>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-primary" (click)="save()">💾 Sauvegarder</button>
          <button class="btn-secondary" (click)="cancel()">Annuler</button>
        </div>
      </div>

      <!-- Filter -->
      <div class="filter-bar">
        <select [(ngModel)]="filterSentiment" (change)="applyFilter()">
          <option value="">Tous les sentiments</option>
          <option value="POSITIVE">😊 Positif</option>
          <option value="NEUTRAL">😐 Neutre</option>
          <option value="NEGATIVE">😞 Négatif</option>
        </select>
        <select [(ngModel)]="filterRating" (change)="applyFilter()">
          <option value="">Toutes les notes</option>
          <option *ngFor="let r of [5,4,3,2,1]" [value]="r">{{ r }} étoile{{ r > 1 ? 's' : '' }}</option>
        </select>
      </div>

      <!-- Reviews List -->
      <div class="reviews-grid">
        <div *ngFor="let avis of filteredAvis" class="review-card"
          [class.positive]="avis.sentiment === 'POSITIVE'"
          [class.negative]="avis.sentiment === 'NEGATIVE'"
          [class.neutral]="avis.sentiment === 'NEUTRAL'">
          <div class="review-header">
            <h3>{{ avis.titre }}</h3>
            <span class="sentiment-badge" [ngClass]="'badge-' + (avis.sentiment || 'neutral').toLowerCase()">
              {{ getSentimentEmoji(avis.sentiment) }} {{ avis.sentiment || 'N/A' }}
            </span>
          </div>
          <p class="review-comment">{{ avis.commentaire }}</p>
          <div class="review-footer">
            <div class="stars">
              <span *ngFor="let s of [1,2,3,4,5]" [class.active]="s <= avis.rating">★</span>
            </div>
            <span class="date">{{ avis.createdAt | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="review-actions">
            <button class="btn-sm btn-edit" (click)="edit(avis)">✏️</button>
            <button class="btn-sm btn-delete" (click)="deleteAvis(avis.id!)">🗑️</button>
          </div>
        </div>
      </div>

      <div *ngIf="filteredAvis.length === 0" class="empty-state">
        <p>Aucun avis trouvé.</p>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    h1 { color: #1e3a5f; font-size: 1.8rem; }
    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white; border: none; padding: 0.6rem 1.2rem;
      border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600;
    }
    .btn-primary:hover { opacity: 0.9; }
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
    .form-group label { display: block; margin-bottom: 0.3rem; color: #475569; font-weight: 500; font-size: 0.9rem; }
    .form-group input, .form-group textarea, .form-group select {
      width: 100%; padding: 0.6rem; border: 1px solid #d1d5db;
      border-radius: 8px; font-size: 0.9rem; box-sizing: border-box;
    }
    .star-rating .star {
      font-size: 1.8rem; color: #d1d5db; cursor: pointer; transition: color 0.2s;
    }
    .star-rating .star.active { color: #f59e0b; }
    .form-actions { display: flex; gap: 0.5rem; }
    .filter-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .filter-bar select {
      padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 8px;
      background: white; font-size: 0.9rem;
    }
    .reviews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1rem; }
    .review-card {
      background: white; border-radius: 12px; padding: 1.2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-left: 4px solid #d1d5db;
      transition: transform 0.2s;
    }
    .review-card:hover { transform: translateY(-2px); }
    .review-card.positive { border-left-color: #22c55e; }
    .review-card.negative { border-left-color: #ef4444; }
    .review-card.neutral { border-left-color: #f59e0b; }
    .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .review-header h3 { font-size: 1rem; color: #1e3a5f; margin: 0; }
    .sentiment-badge {
      font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; font-weight: 600;
    }
    .badge-positive { background: #dcfce7; color: #166534; }
    .badge-negative { background: #fee2e2; color: #991b1b; }
    .badge-neutral { background: #fef3c7; color: #92400e; }
    .review-comment { color: #475569; font-size: 0.9rem; margin-bottom: 0.75rem; }
    .review-footer { display: flex; justify-content: space-between; align-items: center; }
    .stars span { color: #d1d5db; font-size: 1.1rem; }
    .stars span.active { color: #f59e0b; }
    .date { color: #94a3b8; font-size: 0.8rem; }
    .review-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
    .btn-sm {
      padding: 0.3rem 0.6rem; border: none; border-radius: 6px;
      cursor: pointer; font-size: 0.8rem;
    }
    .btn-edit { background: #e0f2fe; }
    .btn-delete { background: #fee2e2; }
    .empty-state { text-align: center; padding: 3rem; color: #94a3b8; }
  `]
})
export class AvisListComponent implements OnInit {
  avisList: Avis[] = [];
  filteredAvis: Avis[] = [];
  showForm = false;
  editingId: number | null = null;
  formData: Avis = { titre: '', commentaire: '', rating: 5 };
  filterSentiment = '';
  filterRating = '';

  @Output() newAlertsEvent = new EventEmitter<number>();

  constructor(private avisService: AvisService) {}


  ngOnInit(): void {
    this.loadAvis();
  }

  loadAvis(): void {
    this.avisService.getAll().subscribe(data => {
      this.avisList = data;
      this.applyFilter();
      this.emitAlerts();
    });
  }

  private emitAlerts(): void {
    const negativeCount = this.avisList.filter(a => a.sentiment === 'NEGATIVE').length;
    this.newAlertsEvent.emit(negativeCount);
  }


  applyFilter(): void {
    this.filteredAvis = this.avisList.filter(a => {
      if (this.filterSentiment && a.sentiment !== this.filterSentiment) return false;
      if (this.filterRating && a.rating !== +this.filterRating) return false;
      return true;
    });
  }

  getSentimentEmoji(sentiment?: string): string {
    switch (sentiment) {
      case 'POSITIVE': return '😊';
      case 'NEGATIVE': return '😞';
      case 'NEUTRAL': return '😐';
      default: return '❓';
    }
  }

  save(): void {
    if (this.editingId) {
      this.avisService.update(this.editingId, this.formData).subscribe(() => {
        this.loadAvis();
        this.cancel();
      });
    } else {
      this.avisService.create(this.formData).subscribe(() => {
        this.loadAvis();
        this.cancel();
      });
    }
  }

  edit(avis: Avis): void {
    this.editingId = avis.id!;
    this.formData = { ...avis };
    this.showForm = true;
  }

  deleteAvis(id: number): void {
    if (confirm('Supprimer cet avis ?')) {
      this.avisService.delete(id).subscribe(() => this.loadAvis());
    }
  }

  cancel(): void {
    this.showForm = false;
    this.editingId = null;
    this.formData = { titre: '', commentaire: '', rating: 5 };
  }
}
