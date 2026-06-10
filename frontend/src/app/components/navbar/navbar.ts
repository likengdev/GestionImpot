import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  showDropdown = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.role = this.authService.getRole();
  }

  getRoleLabel(): string {
    const labels: any = {
      'superadmin': 'DGI',
      'admin': 'Chef de Bureau',
      'gestionnaire': 'Agent Fiscal'
    };
    return labels[this.role] || '';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.showDropdown = false;
    }
  }

  toggleDropdown(): void { this.showDropdown = !this.showDropdown; }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}