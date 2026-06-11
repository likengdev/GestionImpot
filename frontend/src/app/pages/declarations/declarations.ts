import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Navbar } from '../../components/navbar/navbar';
import { DeclarationService } from '../../services/declaration.service';
import { ContribuableService } from '../../services/contribuable.service';
import { ImpotService } from '../../services/impot.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-declarations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Sidebar, Navbar],
  templateUrl: './declarations.html',
  styleUrl: './declarations.scss'
})
export class Declarations implements OnInit {
  declarations: any[] = [];
  contribuables: any[] = [];
  impots: any[] = [];
  showModal = false;
  isEditing = false;
  selectedId: number | null = null;
  errorMessage = '';
  successMessage = '';
  peutValider = false;
  peutSoumettre = false;
  isSubmitting = false;
  actionEnCours: number | null = null;
  form: FormGroup;

  constructor(
    private declarationService: DeclarationService,
    private contribuableService: ContribuableService,
    private impotService: ImpotService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      contribuable: ['', Validators.required],
      impot: ['', Validators.required],
      periode: ['', Validators.required],
      montant_declare: ['', [Validators.required, Validators.min(1)]],
      statut: ['brouillon']
    });
  }

  ngOnInit(): void {
    this.peutValider = this.authService.estAdmin();
    this.peutSoumettre = true;
    this.loadAll();
  }

  loadAll(): void {
    this.declarationService.getAll().subscribe({ next: (d) => this.declarations = d });
    this.contribuableService.getAll().subscribe({ next: (d) => this.contribuables = d });
    this.impotService.getAll().subscribe({ next: (d) => this.impots = d });
  }

  getStatutClass(s: string): string {
    const c: any = { 'brouillon': 'badge-secondary', 'soumise': 'badge-warning', 'validee': 'badge-success', 'rejetee': 'badge-danger' };
    return c[s] || 'badge-secondary';
  }

  getStatutLabel(s: string): string {
    const l: any = { 'brouillon': 'Brouillon', 'soumise': 'Soumise', 'validee': 'Validée', 'rejetee': 'Rejetée' };
    return l[s] || s;
  }

  executeAction(id: number, action: 'soumettre' | 'valider' | 'rejeter'): void {
    if (this.actionEnCours !== null) return;
    this.actionEnCours = id;
    this.errorMessage = '';

    const request$ = action === 'soumettre' ? this.declarationService.soumettre(id)
                 : action === 'valider' ? this.declarationService.valider(id)
                 : this.declarationService.rejeter(id);

    request$.pipe(
      finalize(() => { this.actionEnCours = null; }) // 🔑 Garantit que le bouton se réactive
    ).subscribe({
      next: () => {
        this.successMessage = `Déclaration ${action === 'soumettre' ? 'soumise' : action === 'valider' ? 'validée' : 'rejetée'}.`;
        this.loadAll();
        this.authService.notifierChangement();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (e) => { this.errorMessage = e.error?.error || e.error?.detail || 'Erreur.'; }
    });
  }

  soumettre(id: number): void { this.executeAction(id, 'soumettre'); }
  valider(id: number): void { this.executeAction(id, 'valider'); }
  rejeter(id: number): void { this.executeAction(id, 'rejeter'); }

  openAddModal(): void {
    this.isEditing = false; this.selectedId = null; this.form.reset({ statut: 'brouillon' });
    this.errorMessage = ''; this.isSubmitting = false; this.showModal = true;
  }

  openEditModal(d: any): void {
    this.isEditing = true;
    this.selectedId = d.id;
    // CORRIGÉ : extraire les IDs des objets imbriqués pour les selects
    this.form.patchValue({
      contribuable: d.contribuable?.id ?? d.contribuable,
      impot: d.impot?.id ?? d.impot,
      periode: d.periode,
      montant_declare: d.montant_declare,
      statut: d.statut
    });
    this.errorMessage = '';
    this.isSubmitting = false;
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.errorMessage = ''; this.isSubmitting = false; }

  onSubmit(): void {
    this.form.markAllAsTouched(); if (this.form.invalid) { this.isSubmitting = false; return; }
    this.isSubmitting = true;
    const data = this.form.value;

    const request$ = this.isEditing && this.selectedId 
      ? this.declarationService.update(this.selectedId, data) 
      : this.declarationService.create(data);

    request$.pipe(
      finalize(() => { this.isSubmitting = false; })
    ).subscribe({
      next: () => {
        this.successMessage = this.isEditing ? 'Modifiée.' : 'Créée.';
        this.closeModal(); this.loadAll(); this.authService.notifierChangement();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (e) => { this.errorMessage = e.error?.detail || 'Erreur.'; }
    });
  }

  delete(id: number): void {
    if (!confirm('Supprimer cette déclaration ?')) return;
    this.declarationService.delete(id).subscribe({
      next: () => {
        this.successMessage = 'Supprimée.';
        this.loadAll();
        setTimeout(() => this.successMessage = '', 3000);
      }
    });
  }
}