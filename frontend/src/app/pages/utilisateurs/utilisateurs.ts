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
      email: ['', [Validators.required, Validators.email]],
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

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.register(this.form.value).pipe(
      finalize(() => { this.isSubmitting = false; }) // 🔑 Garantit la réactivation
    ).subscribe({
      next: (res: any) => {
        this.closeModal(); this.loadUsers();
        if (res.email_envoye) {
          this.successMessage = `Compte "${res.username}" créé. Email envoyé à ${res.email}.`;
          this.passwordMessage = `Mot de passe (copie de secours) : ${res.mot_de_passe}`;
        } else {
          this.successMessage = `Compte "${res.username}" créé.`;
          this.passwordMessage = `Mot de passe généré : ${res.mot_de_passe}`;
          if (res.erreur_email) { this.errorMessage = `Email non envoyé : ${res.erreur_email}`; }
        }
        setTimeout(() => { this.successMessage = ''; this.passwordMessage = ''; this.errorMessage = ''; }, 20000);
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