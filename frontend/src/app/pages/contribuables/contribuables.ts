import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Navbar } from '../../components/navbar/navbar';
import { ContribuableService } from '../../services/contribuable.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-contribuables',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Sidebar, Navbar],
  templateUrl: './contribuables.html',
  styleUrl: './contribuables.scss'
})
export class Contribuables implements OnInit {
  contribuables: any[] = [];
  showModal = false;
  isEditing = false;
  selectedId: number | null = null;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';
  peutModifier = false;
  isSubmitting = false;
  form: FormGroup;

  constructor(
    private contribuableService: ContribuableService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      nom: ['', Validators.required],
      prenom: [''],
      nif: ['', Validators.required],
      type_contribuable: ['particulier'],
      adresse: [''],
      telephone: [''],
      email: ['', Validators.email]
    });
  }

  ngOnInit(): void {
    this.peutModifier = this.authService.estAdmin();
    this.loadContribuables();
  }

  loadContribuables(): void {
    this.contribuableService.getAll().subscribe({
      next: (data) => { this.contribuables = data; },
      error: (err) => { console.error(err); }
    });
  }

  get filteredContribuables(): any[] {
    if (!this.searchTerm.trim()) return this.contribuables;
    const t = this.searchTerm.toLowerCase();
    return this.contribuables.filter(c =>
      c.nom.toLowerCase().includes(t) ||
      c.nif.toLowerCase().includes(t) ||
      (c.prenom || '').toLowerCase().includes(t)
    );
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selectedId = null;
    this.form.reset({ type_contribuable: 'particulier' });
    this.errorMessage = '';
    this.isSubmitting = false;
    this.showModal = true;
  }

  openEditModal(c: any): void {
    this.isEditing = true;
    this.selectedId = c.id;
    this.form.patchValue(c);
    this.errorMessage = '';
    this.isSubmitting = false;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.errorMessage = '';
    this.isSubmitting = false;
  }

  onSubmit(): void {
    this.form.markAllAsTouched(); if (this.form.invalid) { this.isSubmitting = false; return; }
    this.isSubmitting = true;
    const data = this.form.value;

    const request$ = this.isEditing && this.selectedId 
      ? this.contribuableService.update(this.selectedId, data) 
      : this.contribuableService.create(data);

    request$.pipe(
      finalize(() => { this.isSubmitting = false; }) // 🔑 Garantit que le bouton se réactive TOUJOURS
    ).subscribe({
      next: () => {
        this.successMessage = this.isEditing ? 'Contribuable modifié avec succès.' : 'Contribuable ajouté avec succès.';
        this.closeModal();
        this.loadContribuables();
        this.authService.notifierChangement();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.nif?.[0] || err.error?.detail || 'Erreur lors de l\'opération.';
      }
    });
  }

  delete(id: number): void {
    if (!confirm('Supprimer ce contribuable ?')) return;
    this.contribuableService.delete(id).subscribe({
      next: () => {
        this.successMessage = 'Supprimé avec succès.';
        this.contribuables = this.contribuables.filter(c => c.id !== id);
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => { this.errorMessage = 'Erreur lors de la suppression.'; }
    });
  }
}