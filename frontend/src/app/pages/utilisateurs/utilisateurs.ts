import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Navbar } from '../../components/navbar/navbar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Sidebar, Navbar],
  templateUrl: './utilisateurs.html',
  styleUrl: './utilisateurs.scss'
})
export class Utilisateurs implements OnInit {
  users: any[] = [];
  showModal = false;
  showToggleModal = false;
  userToToggle: any = null;
  errorMessage = '';
  successMessage = '';
  passwordMessage = '';
  isSubmitting = false;
  isToggling = false;
  form: FormGroup;

  constructor(private authService: AuthService, private fb: FormBuilder) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.email]],
      first_name: [''],
      last_name: [''],
      role: ['gestionnaire', Validators.required]
    });
  }

  ngOnInit(): void { this.loadUsers(); }

  loadUsers(): void {
    this.authService.getUsers().subscribe({
      next: (data) => { this.users = data; },
      error: (err) => { console.error(err); }
    });
  }

  getRoleLabel(role: string): string {
    const l: any = { 'superadmin': 'DGI', 'admin': 'Chef de Bureau', 'gestionnaire': 'Agent Fiscal' };
    return l[role] || role;
  }

  getRoleClass(role: string): string {
    const c: any = { 'superadmin': 'badge-yellow', 'admin': 'badge-blue', 'gestionnaire': 'badge-green' };
    return c[role] || 'badge-secondary';
  }

  estActif(user: any): boolean { return user.profil?.est_actif !== false; }

  openModal(): void {
    this.form.reset({ role: 'gestionnaire' });
    this.errorMessage = ''; this.passwordMessage = ''; this.isSubmitting = false; this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.errorMessage = ''; this.isSubmitting = false; }

  confirmerToggle(user: any): void {
    if (this.isToggling) return;
    this.userToToggle = user;
    this.showToggleModal = true;
  }

  annulerToggle(): void { this.userToToggle = null; this.showToggleModal = false; this.isToggling = false; }

  toggleUtilisateur(): void {
    if (!this.userToToggle || this.isToggling) return;
    const user = this.userToToggle;
    const activer = !this.estActif(user);
    this.isToggling = true;

    this.authService.toggleUserActive(user.id, activer).pipe(
      finalize(() => { this.isToggling = false; }) // 🔑 Garantit la réactivation
    ).subscribe({
      next: (res: any) => {
        this.successMessage = res.message;
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index] = { ...this.users[index], profil: { ...this.users[index].profil, est_actif: res.est_actif } };
        }
        this.annulerToggle();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Erreur lors de la modification du statut.';
        this.annulerToggle();
      }
    });
  }

  rawPassword = '';

  copierMotDePasse(): void {
    const text = this.rawPassword;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Mot de passe copié dans le presse-papier !');
      });
    }
  }

  onSubmit(): void {
    this.form.markAllAsTouched(); if (this.form.invalid) { this.isSubmitting = false; return; }
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.errorMessage = '';

    // Nettoyer les champs vides avant envoi — évite les erreurs de validation backend
    const payload: any = { ...this.form.value };
    if (!payload.email) delete payload.email;
    if (!payload.first_name) delete payload.first_name;
    if (!payload.last_name) delete payload.last_name;

    this.authService.register(payload).pipe(
      finalize(() => { this.isSubmitting = false; }) // 🔑 Garantit la réactivation
    ).subscribe({
      next: (res: any) => {
        this.closeModal(); this.loadUsers();
        this.rawPassword = res.mot_de_passe || '';
        const roleLabel = this.getRoleLabel(res.role || this.form.value.role);
        this.successMessage = `Compte "${res.username}" (${roleLabel}) créé avec succès.`;
        this.passwordMessage = `Mot de passe par défaut : ${res.mot_de_passe}  —  L'utilisateur peut se connecter immédiatement.`;
      },
      error: (err) => {
        const errors = err.error;
        if (errors?.username) this.errorMessage = errors.username[0];
        else if (errors?.email) this.errorMessage = errors.email[0];
        else if (errors?.error) this.errorMessage = errors.error;
        else this.errorMessage = errors?.detail || 'Erreur lors de la création.';
      }
    });
  }
}