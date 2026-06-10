import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Navbar } from '../../components/navbar/navbar';
import { DashboardService } from '../../services/dashboard.service';
import { ImpotService } from '../../services/impot.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Navbar],
  templateUrl: './rapports.html',
  styleUrl: './rapports.scss'
})
export class Rapports implements OnInit, AfterViewInit {
  @ViewChild('revenusChart') revenusChartRef!: ElementRef;
  @ViewChild('statutsChart') statutsChartRef!: ElementRef;

  statistiques: any = {
    contribuables_enregistres: 0,
    total_impots_collectes: 0,
    impots_impayes: 0,
    penalites_en_retard: 0
  };

  anneeSelectionnee = new Date().getFullYear();
  annees = [2024, 2025, 2026, 2027];
  revenusChart: any;
  statutsChart: any;
  isExporting = false;

  constructor(
    private dashboardService: DashboardService,
    private impotService: ImpotService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  ngAfterViewInit(): void {
    // Délai augmenté pour garantir que les canvas sont rendus dans le DOM
    setTimeout(() => {
      this.loadRevenusChart();
      this.loadStatutsChart();
    }, 300);
  }

  loadStats(): void {
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => { this.statistiques = data; },
      error: (err) => { console.error('Erreur chargement stats :', err); }
    });
  }

  onAnneeChange(): void {
    // Forcer la conversion en number pour éviter les problèmes de type string/number avec ngModel
    this.anneeSelectionnee = Number(this.anneeSelectionnee);
    this.loadRevenusChart();
  }

  loadRevenusChart(): void {
    if (!this.revenusChartRef?.nativeElement) return;
    this.dashboardService.getRevenusMensuels(this.anneeSelectionnee).subscribe({
      next: (data) => {
        if (this.revenusChart) this.revenusChart.destroy();
        const ctx = this.revenusChartRef.nativeElement.getContext('2d');
        this.revenusChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data.labels,
            datasets: [{
              label: 'Revenus (FCFA)',
              data: data.data,
              backgroundColor: 'rgba(26,35,126,0.7)',
              borderColor: '#1a237e',
              borderWidth: 2,
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
          }
        });
      },
      error: (err) => { console.error('Erreur graphique revenus :', err); }
    });
  }

  loadStatutsChart(): void {
    if (!this.statutsChartRef?.nativeElement) return;
    this.impotService.getStatistiques().subscribe({
      next: (data) => {
        if (this.statutsChart) this.statutsChart.destroy();
        const ctx = this.statutsChartRef.nativeElement.getContext('2d');
        this.statutsChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Collecté', 'Impayé', 'En retard'],
            datasets: [{
              data: [
                data.impots_payes || 0,
                data.total_montant - (data.impots_payes || 0) - (data.impots_en_retard || 0),
                data.impots_en_retard || 0
              ],
              backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
              borderWidth: 2
            }]
          },
          options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
      },
      error: (err) => { console.error('Erreur graphique statuts :', err); }
    });
  }

  exporterPDF(): void {
    this.isExporting = true;
    const dateNow = new Date().toLocaleDateString('fr-FR');
    const annee = this.anneeSelectionnee;

    const contenu = `
      <html>
      <head>
        <title>Rapport Fiscal ${annee}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { color: #1a237e; text-align: center; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #1a237e; padding-bottom: 20px; }
          .stats { display: flex; justify-content: space-around; margin: 30px 0; }
          .stat-box { text-align: center; padding: 20px; background: #f4f6f9; border-radius: 8px; width: 22%; }
          .stat-value { font-size: 24px; font-weight: bold; color: #1a237e; }
          .stat-label { font-size: 14px; color: #666; margin-top: 8px; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SYSTÈME DE GESTION DES IMPÔTS</h1>
          <h2>Rapport Fiscal — Année ${annee}</h2>
          <p>Généré le ${dateNow}</p>
        </div>
        <div class="stats">
          <div class="stat-box">
            <div class="stat-value">${this.statistiques.contribuables_enregistres || 0}</div>
            <div class="stat-label">Contribuables</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${this.formatMontant(this.statistiques.total_impots_collectes)}</div>
            <div class="stat-label">Total Collecté (FCFA)</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${this.formatMontant(this.statistiques.impots_impayes)}</div>
            <div class="stat-label">Impôts Impayés (FCFA)</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${this.formatMontant(this.statistiques.penalites_en_retard)}</div>
            <div class="stat-label">Pénalités en Retard (FCFA)</div>
          </div>
        </div>
        <div class="footer">
          <p>GestImpôts — Système Officiel de Gestion Fiscale</p>
          <p>Ce rapport est confidentiel et destiné uniquement aux agents autorisés.</p>
        </div>
      </body>
      </html>
    `;

    const fenetre = window.open('', '_blank');
    if (fenetre) {
      fenetre.document.write(contenu);
      fenetre.document.close();
      fenetre.focus();
      setTimeout(() => {
        fenetre.print();
        fenetre.close();
        this.isExporting = false;
      }, 500);
    } else {
      this.isExporting = false;
    }
  }

  formatMontant(m: number): string {
    return new Intl.NumberFormat('fr-FR').format(m || 0);
  }
}