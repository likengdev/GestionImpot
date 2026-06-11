import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Navbar } from '../../components/navbar/navbar';
import { ImpotService } from '../../services/impot.service';
import { ContribuableService } from '../../services/contribuable.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-impots',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Sidebar, Navbar],
  templateUrl: './impots.html',
  styleUrl: './impots.scss'
})
export class Impots implements OnInit {
  impots: any[] = [];
  contribuables: any[] = [];
  showModal = false;
  isEditing = false;
  selectedId: number | null = null;
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;
  form: FormGroup;

  typesImpot = [
    { value: 'revenu', label: 'Impôt sur le revenu' },
    { value: 'societe', label: 'Impôt sur les sociétés' },
    { value: 'tva', label: 'TVA' },
    { value: 'foncier', label: 'Impôt foncier' },
    { value: 'autre', label: 'Autre' }
  ];

  constructor(
    private impotService: ImpotService,
    private contribuableService: ContribuableService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      contribuable: ['', Validators.required],
      type_impot: ['', Validators.required],
      montant: ['', [Validators.required, Validators.min(1)]],
      date_echeance: ['', Validators.required],
      statut: ['en_attente'],
      description: ['']
    });
  }

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.impotService.getAll().subscribe({ next: (d) => this.impots = d });
    this.contribuableService.getAll().subscribe({ next: (d) => this.contribuables = d });
  }

  getStatutClass(s: string): string {
    const c: any = { 'en_attente': 'badge-warning', 'paye': 'badge-success', 'en_retard': 'badge-danger', 'annule': 'badge-secondary' };
    return c[s] || 'badge-secondary';
  }

  getStatutLabel(s: string): string {
    const l: any = { 'en_attente': 'En attente', 'paye': 'Payé', 'en_retard': 'En retard', 'annule': 'Annulé' };
    return l[s] || s;
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selectedId = null;
    this.form.reset({ statut: 'en_attente' });
    this.errorMessage = '';
    this.isSubmitting = false;
    this.showModal = true;
  }

  openEditModal(i: any): void {
    this.isEditing = true;
    this.selectedId = i.id;
    // CORRIGÉ : extraire l'ID du contribuable si c'est un objet
    this.form.patchValue({
      contribuable: i.contribuable?.id ?? i.contribuable,
      type_impot: i.type_impot,
      montant: i.montant,
      date_echeance: i.date_echeance,
      statut: i.statut,
      description: i.description
    });
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
      ? this.impotService.update(this.selectedId, data)
      : this.impotService.create(data);

    request$.pipe(
      finalize(() => { this.isSubmitting = false; }) // 🔑 Garantit que le bouton se réactive TOUJOURS
    ).subscribe({
      next: () => {
        this.successMessage = this.isEditing ? 'Impôt modifié.' : 'Impôt créé avec succès.';
        this.closeModal();
        this.loadAll();
        this.authService.notifierChangement();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => { 
        this.errorMessage = err.error?.detail || err.error?.montant?.[0] || 'Erreur lors de l\'opération.'; 
      }
    });
  }

  delete(id: number): void {
    if (!confirm('Supprimer cet impôt ?')) return;
    this.impotService.delete(id).subscribe({
      next: () => {
        this.successMessage = 'Supprimé avec succès.';
        this.impots = this.impots.filter(i => i.id !== id);
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => { this.errorMessage = 'Erreur lors de la suppression.'; }
    });
  }
}