import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AvisService } from '../../../core/services/avis.service';
import { ReclamationService } from '../../../core/services/reclamation.service';
import { AvisStats } from '../../../core/models/avis.model';
import { ReclamationStats } from '../../../core/models/reclamation.model';

@Component({
  selector: 'app-dashboard-reclamation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h1>📊 Dashboard Intelligent</h1>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">⭐</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ avisStats?.averageRating || 0 }}</span>
            <span class="kpi-label">Note Moyenne</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📝</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ avisStats?.totalReviews || 0 }}</span>
            <span class="kpi-label">Total Avis</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📬</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ reclamationStats?.total || 0 }}</span>
            <span class="kpi-label">Réclamations</span>
          </div>
        </div>
        <div class="kpi-card kpi-urgent">
          <div class="kpi-icon">🚨</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ reclamationStats?.priorityDistribution?.['HIGH'] || 0 }}</span>
            <span class="kpi-label">Urgentes</span>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-grid">
        <div class="chart-card">
          <h3>Sentiment des Avis</h3>
          <canvas #sentimentChart></canvas>
        </div>
        <div class="chart-card">
          <h3>Statut des Réclamations</h3>
          <canvas #statusChart></canvas>
        </div>
        <div class="chart-card">
          <h3>Priorité des Réclamations</h3>
          <canvas #priorityChart></canvas>
        </div>
        <div class="chart-card">
          <h3>Catégories des Réclamations</h3>
          <canvas #categoryChart></canvas>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    h1 {
      color: #1e3a5f;
      margin-bottom: 1.5rem;
      font-size: 1.8rem;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .kpi-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      border-left: 4px solid #3b82f6;
      transition: transform 0.2s;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
    }
    .kpi-urgent {
      border-left-color: #ef4444;
    }
    .kpi-icon {
      font-size: 2rem;
    }
    .kpi-content {
      display: flex;
      flex-direction: column;
    }
    .kpi-value {
      font-size: 2rem;
      font-weight: 700;
      color: #1e3a5f;
    }
    .kpi-label {
      color: #64748b;
      font-size: 0.85rem;
    }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }
    .chart-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    .chart-card h3 {
      color: #1e3a5f;
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }
  `]
})
export class DashboardReclamationComponent implements OnInit, AfterViewInit {
  @ViewChild('sentimentChart') sentimentChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('priorityChart') priorityChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef<HTMLCanvasElement>;

  avisStats: AvisStats | null = null;
  reclamationStats: ReclamationStats | null = null;
  private chartsReady = false;
  private dataReady = false;
  private isBrowser: boolean;

  constructor(
    private avisService: AvisService,
    private reclamationService: ReclamationService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.avisService.getStats().subscribe(stats => {
      this.avisStats = stats;
      this.tryRenderCharts();
    });
    this.reclamationService.getStats().subscribe(stats => {
      this.reclamationStats = stats;
      this.tryRenderCharts();
    });
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    this.tryRenderCharts();
  }

  private tryRenderCharts(): void {
    if (!this.isBrowser || !this.chartsReady || !this.avisStats || !this.reclamationStats) return;
    if (this.dataReady) return;
    this.dataReady = true;

    import('chart.js/auto').then(({ default: Chart }) => {
      this.renderSentimentChart(Chart);
      this.renderStatusChart(Chart);
      this.renderPriorityChart(Chart);
      this.renderCategoryChart(Chart);
    });
  }

  private renderSentimentChart(Chart: any): void {
    const dist = this.avisStats!.sentimentDistribution || {};
    new Chart(this.sentimentChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Positif', 'Neutre', 'Négatif'],
        datasets: [{
          data: [dist['POSITIVE'] || 0, dist['NEUTRAL'] || 0, dist['NEGATIVE'] || 0],
          backgroundColor: ['#22c55e', '#f59e0b', '#ef4444']
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }

  private renderStatusChart(Chart: any): void {
    const dist = this.reclamationStats!.statusDistribution || {};
    new Chart(this.statusChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['En attente', 'En cours', 'Résolu', 'Rejeté'],
        datasets: [{
          label: 'Réclamations',
          data: [dist['PENDING'] || 0, dist['IN_PROGRESS'] || 0, dist['RESOLVED'] || 0, dist['REJECTED'] || 0],
          backgroundColor: ['#f59e0b', '#3b82f6', '#22c55e', '#ef4444']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  private renderPriorityChart(Chart: any): void {
    const dist = this.reclamationStats!.priorityDistribution || {};
    new Chart(this.priorityChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Haute', 'Moyenne', 'Basse'],
        datasets: [{
          data: [dist['HIGH'] || 0, dist['MEDIUM'] || 0, dist['LOW'] || 0],
          backgroundColor: ['#ef4444', '#f59e0b', '#22c55e']
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }

  private renderCategoryChart(Chart: any): void {
    const dist = this.reclamationStats!.categoryDistribution || {};
    const labels = Object.keys(dist);
    const data = Object.values(dist);
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#6366f1', '#14b8a6'];

    new Chart(this.categoryChartRef.nativeElement, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length)
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }
}
