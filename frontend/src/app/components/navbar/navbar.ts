import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit {
  username = '';
  role = '';
  currentTime = new Date();
  showProfile = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.role = this.authService.getRole();
    // Horloge en temps réel
    setInterval(() => this.currentTime = new Date(), 1000);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('.profile-zone')) {
      this.showProfile = false;
    }
  }

  getRoleLabel(): string {
    const m: any = {
      superadmin: 'DGI – Super Admin',
      admin: 'Chef de Bureau',
      gestionnaire: 'Agent Fiscal'
    };
    return m[this.role] || 'Utilisateur';
  }

  getRoleBadgeColor(): string {
    const m: any = { superadmin: '#f59e0b', admin: '#3b82f6', gestionnaire: '#10b981' };
    return m[this.role] || '#9ca3af';
  }

  getGreeting(): string {
    const h = this.currentTime.getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  getExerciceFiscal(): string {
    return `Exercice ${this.currentTime.getFullYear()}`;
  }
}