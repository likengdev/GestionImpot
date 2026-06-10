import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit {
  role = '';
  username = '';
  menuItems: any[] = [];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.role = this.authService.getRole();
    this.username = this.authService.getUsername();
    this.buildMenu();
  }

  buildMenu(): void {
    const tous = [
      { label: 'Tableau de Bord', icon: 'bi bi-speedometer2', route: '/dashboard', roles: ['superadmin', 'admin', 'gestionnaire'] },
      { label: 'Utilisateurs', icon: 'bi bi-people-fill', route: '/utilisateurs', roles: ['superadmin'] },
      { label: 'Contribuables', icon: 'bi bi-person-vcard', route: '/contribuables', roles: ['superadmin', 'admin', 'gestionnaire'] },
      { label: 'Impôts', icon: 'bi bi-cash-stack', route: '/impots', roles: ['superadmin', 'admin'] },
      { label: 'Déclarations', icon: 'bi bi-file-text', route: '/declarations', roles: ['superadmin', 'admin', 'gestionnaire'] },
      { label: 'Paiements', icon: 'bi bi-credit-card', route: '/paiements', roles: ['superadmin', 'admin', 'gestionnaire'] },
      { label: 'Pénalités', icon: 'bi bi-exclamation-triangle', route: '/penalites', roles: ['superadmin', 'admin'] },
      { label: 'Rapports', icon: 'bi bi-bar-chart', route: '/rapports', roles: ['superadmin', 'admin'] },
    ];
    this.menuItems = tous.filter(item => item.roles.includes(this.role));
  }

  getRoleBadge(): string {
    const badges: any = {
      'superadmin': 'DGI - Super Admin',
      'admin': 'Chef de Bureau',
      'gestionnaire': 'Agent Fiscal'
    };
    return badges[this.role] || 'Utilisateur';
  }

  getRoleColor(): string {
    const colors: any = {
      'superadmin': '#f59e0b',
      'admin': '#3b82f6',
      'gestionnaire': '#10b981'
    };
    return colors[this.role] || '#9ca3af';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}