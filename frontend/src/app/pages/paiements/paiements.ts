import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Navbar } from '../../components/navbar/navbar';
import { PaiementService } from '../../services/paiement.service';
import { ImpotService } from '../../services/impot.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-paiements',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Sidebar, Navbar],
  templateUrl: './paiements.html',
  styleUrl: './paiements.scss'
})
export class Paiements implements OnInit {
  paiements: any[] = [];
  impots: any[] = [];
  showModal = false;
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;
  form: FormGroup;

  modesPayment = [
    { value: 'especes', label: 'Espèces' },
    { value: 'virement', label: 'Virement' },
    { value: 'cheque', label: 'Chèque' },
    { value: 'mobile', label: 'Mobile Money' }
  ];

  constructor(
    private paiementService: PaiementService,
    private impotService: ImpotService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      impot: ['', Validators.required],
      montant_paye: ['', [Validators.required, Validators.min(1)]],
      mode_paiement: ['', Validators.required],
      reference: ['', Validators.required],
      commentaire: ['']
    });
  }

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.paiementService.getAll().subscribe({ next: (d) => this.paiements = d });
    this.impotService.getAll().subscribe({ next: (d) => this.impots = d });
  }

  openAddModal(): void {
    this.form.reset(); this.errorMessage = ''; this.isSubmitting = false; this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.errorMessage = ''; this.isSubmitting = false; }

  onSubmit(): void {
    this.form.markAllAsTouched(); if (this.form.invalid) { this.isSubmitting = false; return; }
    this.isSubmitting = true;

    this.paiementService.create(this.form.value).pipe(
      finalize(() => { this.isSubmitting = false; }) // 🔑 Garantit la réactivation
    ).subscribe({
      next: () => {
        this.successMessage = 'Paiement enregistré avec succès.';
        this.closeModal(); this.loadAll(); this.authService.notifierChangement();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.reference?.[0] || err.error?.detail || 'Erreur lors de l\'enregistrement.';
      }
    });
  }

  delete(id: number): void {
    if (!confirm('Supprimer ce paiement ?')) return;
    this.paiementService.delete(id).subscribe({
      next: () => {
        this.successMessage = 'Supprimé.';
        this.paiements = this.paiements.filter(p => p.id !== id);
        setTimeout(() => this.successMessage = '', 3000);
      }
    });
  }
}