export interface Impot {
  id?: number;
  contribuable: number;
  contribuable_nom?: string;
  type_impot: string;
  montant: number;
  date_echeance: string;
  statut: 'en_attente' | 'paye' | 'en_retard' | 'annule';
  description: string;
  date_creation?: string;
}