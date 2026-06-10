import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { noAuthGuard } from './guards/no-auth.guard';
import { adminGuard, superAdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/landing/landing').then(m => m.Landing) },
  { path: 'login', canActivate: [noAuthGuard], loadComponent: () => import('./pages/login/login').then(m => m.Login) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'contribuables', canActivate: [authGuard], loadComponent: () => import('./pages/contribuables/contribuables').then(m => m.Contribuables) },
  { path: 'impots', canActivate: [authGuard, adminGuard], loadComponent: () => import('./pages/impots/impots').then(m => m.Impots) },
  { path: 'declarations', canActivate: [authGuard], loadComponent: () => import('./pages/declarations/declarations').then(m => m.Declarations) },
  { path: 'paiements', canActivate: [authGuard], loadComponent: () => import('./pages/paiements/paiements').then(m => m.Paiements) },
  { path: 'penalites', canActivate: [authGuard, adminGuard], loadComponent: () => import('./pages/penalites/penalites').then(m => m.Penalites) },
  { path: 'rapports', canActivate: [authGuard, adminGuard], loadComponent: () => import('./pages/rapports/rapports').then(m => m.Rapports) },
  { path: 'utilisateurs', canActivate: [authGuard, superAdminGuard], loadComponent: () => import('./pages/utilisateurs/utilisateurs').then(m => m.Utilisateurs) },
  { path: '**', redirectTo: '' }
];