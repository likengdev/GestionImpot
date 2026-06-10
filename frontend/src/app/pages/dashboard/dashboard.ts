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

export type Theme = 'light' | 'dark' | 'blue' | 'green' | 'purple' | 'orange';

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

  role: string = '';
  chart: Chart | null = null;
  showThemePicker: boolean = false;
  currentTheme: Theme = 'light';
  private intervalId: any;
  private refreshSub: any;

  themes: { key: Theme; label: string; primary: string; bg: string }[] = [
    { key: 'light',  label: 'Clair',   primary: '#4f46e5', bg: '#f1f5f9' },
    { key: 'dark',   label: 'Sombre',  primary: '#818cf8', bg: '#0f172a' },
    { key: 'blue',   label: 'Océan',   primary: '#0ea5e9', bg: '#e0f2fe' },
    { key: 'green',  label: 'Nature',  primary: '#059669', bg: '#ecfdf5' },
    { key: 'purple', label: 'Violet',  primary: '#9333ea', bg: '#faf5ff' },
    { key: 'orange', label: 'Soleil',  primary: '#ea580c', bg: '#fff7ed' },
  ];

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getRole() ?? '';
    const saved = localStorage.getItem('appTheme') as Theme;
    this.currentTheme = saved || 'light';
    this.applyTheme(this.currentTheme);

    this.loadDashboard();

    this.refreshSub = this.authService.dashboardRefresh$.subscribe(refresh => {
      if (refresh) { this.loadDashboard(); this.loadChart(); }
    });

    this.intervalId = setInterval(() => {
      this.loadDashboard();
      this.loadChart();
    }, 30000);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.loadChart(), 500);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.chart) this.chart.destroy();
    if (this.refreshSub) this.refreshSub.unsubscribe();
  }

  // Fermer le picker si clic en dehors
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.theme-picker-wrapper')) {
      this.showThemePicker = false;
    }
  }

  toggleThemePicker(event: MouseEvent): void {
    event.stopPropagation();
    this.showThemePicker = !this.showThemePicker;
  }

  selectTheme(theme: Theme): void {
    this.currentTheme = theme;
    localStorage.setItem('appTheme', theme);
    this.applyTheme(theme);
    this.showThemePicker = false;
    setTimeout(() => this.loadChart(), 150);
  }

  applyTheme(theme: Theme): void {
    document.body.classList.remove('theme-light','theme-dark','theme-blue','theme-green','theme-purple','theme-orange');
    document.body.classList.add(`theme-${theme}`);
  }

  getThemeLabel(): string {
    return this.themes.find(t => t.key === this.currentTheme)?.label ?? 'Thème';
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
      error: (err) => console.error('Erreur dashboard : ', err)
    });
  }

  loadChart(): void {
    if (!this.revenusChartRef) return;
    this.dashboardService.getRevenusMensuels().subscribe({
      next: (data) => {
        if (this.chart) this.chart.destroy();
        const ctx = this.revenusChartRef.nativeElement.getContext('2d');
        if (!ctx) return;

        const isDark = ['dark'].includes(this.currentTheme);
        const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
        const labelColor = isDark ? '#94a3b8' : '#64748b';
        const barColors: Record<Theme, string> = {
          light: 'rgba(99,102,241,0.75)', dark: 'rgba(129,140,248,0.75)',
          blue: 'rgba(14,165,233,0.75)', green: 'rgba(5,150,105,0.75)',
          purple: 'rgba(147,51,234,0.75)', orange: 'rgba(234,88,12,0.75)'
        };
        const barBorders: Record<Theme, string> = {
          light: '#6366f1', dark: '#818cf8', blue: '#0ea5e9',
          green: '#059669', purple: '#9333ea', orange: '#ea580c'
        };

        this.chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data?.labels ?? [],
            datasets: [
              {
                label: 'Revenus (FCFA)',
                data: data?.data ?? [],
                backgroundColor: barColors[this.currentTheme],
                borderColor: barBorders[this.currentTheme],
                borderWidth: 2,
                borderRadius: 8,
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
            plugins: { legend: { position: 'top', labels: { color: labelColor, font: { size: 12 } } } },
            scales: {
              y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: labelColor } },
              x: { grid: { display: false }, ticks: { color: labelColor } }
            }
          }
        });
      },
      error: (err) => console.error('Erreur graphique : ', err)
    });
  }

  estAdmin(): boolean { return this.authService.estAdmin(); }
  estSuperAdmin(): boolean { return this.authService.estSuperAdmin(); }

  getStatutClass(statut?: string): string {
    const classes: Record<string, string> = {
      paye: 'badge-success', soumise: 'badge-warning', en_retard: 'badge-danger',
      brouillon: 'badge-secondary', validee: 'badge-success', rejetee: 'badge-danger'
    };
    return classes[statut ?? ''] ?? 'badge-secondary';
  }

  getStatutLabel(statut?: string): string {
    const labels: Record<string, string> = {
      paye: 'Payé', soumise: 'Soumise', en_retard: 'En retard',
      brouillon: 'Brouillon', validee: 'Validée', rejetee: 'Rejetée'
    };
    return labels[statut ?? ''] ?? 'Inconnu';
  }

  formatMontant(montant?: number): string {
    return new Intl.NumberFormat('fr-FR').format(montant ?? 0);
  }
}