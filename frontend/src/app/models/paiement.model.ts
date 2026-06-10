export interface Paiement {
  id?: number;
  impot: number;
  contribuable_nom?: string;
  montant_paye: number;
  mode_paiement: 'especes' | 'virement' | 'cheque' | 'mobile';
  reference: string;
  date_paiement?: string;
  commentaire: string;
}