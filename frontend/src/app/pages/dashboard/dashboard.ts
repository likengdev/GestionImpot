import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Navbar } from '../../components/navbar/navbar';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, Sidebar, Navbar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('revenusChart') revenusChartRef!: ElementRef<HTMLCanvasElement>;

  dashboardData: any = {
    contribuables_enregistres: 0,
    total_impots_collectes: 0,
    impots_impayes: 0,
    penalites_en_retard: 0,
    activite_recente: []
  };

  role = '';
  chart: Chart | null = null;
  isDark = false;
  private intervalId: any;
  private refreshSub: any;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getRole() ?? '';
    const saved = localStorage.getItem('appTheme');
    this.isDark = saved === 'dark';
    this.applyTheme();

    this.loadDashboard();

    this.refreshSub = this.authService.dashboardRefresh$.subscribe(r => {
      if (r) { this.loadDashboard(); this.loadChart(); }
    });

    this.intervalId = setInterval(() => { this.loadDashboard(); this.loadChart(); }, 30000);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.loadChart(), 300);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.chart) this.chart.destroy();
    if (this.refreshSub) this.refreshSub.unsubscribe();
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    localStorage.setItem('appTheme', this.isDark ? 'dark' : 'light');
    this.applyTheme();
    setTimeout(() => this.loadChart(), 150);
  }

  applyTheme(): void {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(this.isDark ? 'theme-dark' : 'theme-light');
  }

  loadDashboard(): void {
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardData = {
          contribuables_enregistres: data?.contribuables_enregistres ?? 0,
          total_impots_collectes: data?.total_impots_collectes ?? 0,
          impots_impayes: data?.impots_impayes ?? 0,
          penalites_en_retard: data?.penalites_en_retard ?? 0,
          activite_recente: data?.activite_recente ?? []
        };
      },
      error: (err) => console.error('Erreur dashboard :', err)
    });
  }

  loadChart(): void {
    if (!this.revenusChartRef?.nativeElement) return;
    this.dashboardService.getRevenusMensuels().subscribe({
      next: (data) => {
        if (this.chart) this.chart.destroy();
        const ctx = this.revenusChartRef.nativeElement.getContext('2d');
        if (!ctx) return;

        const gridColor = this.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
        const labelColor = this.isDark ? '#94a3b8' : '#64748b';

        this.chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data?.labels ?? [],
            datasets: [
              {
                label: 'Revenus (FCFA)',
                data: data?.data ?? [],
                backgroundColor: 'rgba(26,35,126,0.75)',
                borderColor: '#1a237e',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
              },
              {
                label: 'Tendance',
                data: data?.data ?? [],
                type: 'line',
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245,158,11,0.08)',
                borderWidth: 2,
                pointBackgroundColor: '#f59e0b',
                pointRadius: 4,
                tension: 0.4,
                fill: true,
              } as any
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'top',
                labels: { color: labelColor, font: { size: 12 } }
              }
            },
            scales: {
              y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: labelColor } },
              x: { grid: { display: false }, ticks: { color: labelColor } }
            }
          }
        });
      },
      error: (err) => console.error('Erreur graphique :', err)
    });
  }

  estAdmin(): boolean { return this.authService.estAdmin(); }
  estSuperAdmin(): boolean { return this.authService.estSuperAdmin(); }

  getStatutClass(statut?: string): string {
    const m: Record<string, string> = {
      paye: 'badge-success', soumise: 'badge-warning', en_retard: 'badge-danger',
      brouillon: 'badge-secondary', validee: 'badge-success', rejetee: 'badge-danger'
    };
    return m[statut ?? ''] ?? 'badge-secondary';
  }

  getStatutLabel(statut?: string): string {
    const m: Record<string, string> = {
      paye: 'Payé', soumise: 'Soumise', en_retard: 'En retard',
      brouillon: 'Brouillon', validee: 'Validée', rejetee: 'Rejetée'
    };
    return m[statut ?? ''] ?? 'Inconnu';
  }

  formatMontant(v?: number): string {
    return new Intl.NumberFormat('fr-FR').format(v ?? 0);
  }
}