import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DecimalPipe } from '@angular/common';

interface PrixEvaluation {
  prixJusteEstime: number;
  prixMin: number;          // ← NOUVEAU
  prixMax: number;          // ← NOUVEAU
  ecartPourcentage: number;
  evaluation: 'BON_PRIX' | 'LEGEREMENT_SURVALUE' | 'TROP_CHER';
  message: string;
  couleur: string;
}

@Component({
  selector: 'app-prix-evaluation',
  template: `
    <div class="prix-ia-card" *ngIf="result">
      <h4>🤖 Évaluation IA du Prix</h4>

      <div class="badge" [style.background]="result.couleur">
        {{ labelMap[result.evaluation] }}
      </div>

      <p class="message">{{ result.message }}</p>

      <div class="details">
        <span>Prix demandé : <strong>{{ prixDemande }} TND/mois</strong></span>
        <span>Prix juste estimé : <strong>{{ result.prixJusteEstime | number:'1.0-0' }} TND/mois</strong></span>
        <span>Écart : <strong [style.color]="result.couleur">{{ result.ecartPourcentage | number:'1.1-1' }}%</strong></span>
      </div>

      <!-- Barre de progression -->
      <div class="progress-bar">
        <div class="fill"
             [style.width.%]="barWidth"
             [style.background]="result.couleur">
        </div>
      </div>

      <!-- ── Fourchette suggérée ── NOUVEAU ──────────────────────── -->
      <div class="fourchette">
        <p class="fourchette-label">💡 Fourchette recommandée</p>
        <div class="fourchette-range">
          <span class="prix-min">{{ result.prixMin | number:'1.0-0' }} TND</span>
          <div class="range-bar">
            <div class="range-fill"></div>
          </div>
          <span class="prix-max">{{ result.prixMax | number:'1.0-0' }} TND</span>
        </div>
        <p class="fourchette-centre">
          Prix juste : <strong>{{ result.prixJusteEstime | number:'1.0-0' }} TND</strong>
        </p>
      </div>
      <!-- ─────────────────────────────────────────────────────────── -->

    </div>

    <button (click)="evaluer()" [disabled]="loading" class="btn-evaluer">
      {{ loading ? 'Analyse en cours...' : '🔍 Analyser le prix' }}
    </button>
  `,
  styles: [`
    .prix-ia-card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .badge { color: white; padding: 4px 12px; border-radius: 20px; display: inline-block; font-weight: bold; }
    .details { display: flex; flex-direction: column; gap: 4px; margin: 12px 0; }
    .progress-bar { height: 8px; background: #eee; border-radius: 4px; overflow: hidden; }
    .fill { height: 100%; transition: width 0.5s; }
    .btn-evaluer { background: #1976d2; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }

    /* ── Fourchette ── */
    .fourchette { margin-top: 16px; padding: 12px 16px; background: #f0f7ff; border-radius: 8px; border-left: 4px solid #3b82f6; }
    .fourchette-label { font-size: 13px; color: #555; margin: 0 0 8px 0; }
    .fourchette-range { display: flex; align-items: center; gap: 10px; }
    .prix-min { font-weight: 700; font-size: 15px; color: #16a34a; white-space: nowrap; }
    .prix-max { font-weight: 700; font-size: 15px; color: #dc2626; white-space: nowrap; }
    .range-bar { flex: 1; height: 6px; background: linear-gradient(to right, #16a34a, #f59e0b, #dc2626); border-radius: 99px; }
    .fourchette-centre { margin: 8px 0 0 0; font-size: 13px; color: #374151; text-align: center; }
  `]
})
export class PrixEvaluationComponent implements OnInit {
  @Input() annonceId!: number;
  @Input() prixDemande!: number;

  result: PrixEvaluation | null = null;
  loading = false;

  labelMap = {
    BON_PRIX:            '✅ Bon Prix',
    LEGEREMENT_SURVALUE: '⚠️ Légèrement Surévalué',
    TROP_CHER:           '🔴 Trop Cher'
  };

  get barWidth(): number {
    if (!this.result) return 0;
    const ecart = this.result.ecartPourcentage;
    return Math.min(100, Math.max(0, ecart <= 0 ? 20 : ecart <= 5 ? 40 : ecart <= 15 ? 70 : 100));
  }

  constructor(private http: HttpClient) {}
  ngOnInit() { this.evaluer(); }

  evaluer() {
    this.loading = true;
    this.http.get<PrixEvaluation>(`http://192.168.1.175:30808/api/annonces/${this.annonceId}/evaluer-prix`)
      .subscribe({
        next: (res) => { this.result = res; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }
}
