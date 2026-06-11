import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Navbar } from '../../components/navbar/navbar';
import { PenaliteService } from '../../services/penalite.service';
import { ImpotService } from '../../services/impot.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-penalites',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Sidebar, Navbar],
  templateUrl: './penalites.html',
  styleUrl: './penalites.scss'
})
export class Penalites implements OnInit {
  penalites: any[] = [];
  impots: any[] = [];
  showModal = false;
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;
  form: FormGroup;

  constructor(
    private penaliteService: PenaliteService,
    private impotService: ImpotService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      impot: ['', Validators.required],
      montant: ['', [Validators.required, Validators.min(1)]],
      motif: ['', Validators.required]
    });
  }

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.penaliteService.getAll().subscribe({ next: (d) => this.penalites = d });
    this.impotService.getAll().subscribe({ next: (d) => this.impots = d });
  }

  openAddModal(): void {
    this.form.reset(); this.errorMessage = ''; this.isSubmitting = false; this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.errorMessage = ''; this.isSubmitting = false; }

  onSubmit(): void {
    this.form.markAllAsTouched(); if (this.form.invalid) { this.isSubmitting = false; return; }
    this.isSubmitting = true;

    this.penaliteService.create(this.form.value).pipe(
      finalize(() => { this.isSubmitting = false; }) // 🔑 Garantit la réactivation
    ).subscribe({
      next: () => {
        this.successMessage = 'Pénalité appliquée avec succès.';
        this.closeModal(); this.loadAll(); this.authService.notifierChangement();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || err.error?.montant?.[0] || 'Erreur.';
      }
    });
  }

  delete(id: number): void {
    if (!confirm('Supprimer cette pénalité ?')) return;
    this.penaliteService.delete(id).subscribe({
      next: () => {
        this.successMessage = 'Supprimée.';
        this.penalites = this.penalites.filter(p => p.id !== id);
        setTimeout(() => this.successMessage = '', 3000);
      }
    });
  }
}