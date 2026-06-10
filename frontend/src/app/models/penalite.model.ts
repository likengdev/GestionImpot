export interface Penalite {
  id?: number;
  impot: number;
  contribuable_nom?: string;
  montant: number;
  motif: string;
  date_application?: string;
  est_payee: boolean;
}