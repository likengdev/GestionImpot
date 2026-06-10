export interface Declaration {
  id?: number;
  contribuable: number;
  contribuable_nom?: string;
  impot: number;
  periode: string;
  montant_declare: number;
  statut: 'brouillon' | 'soumise' | 'validee' | 'rejetee';
  date_soumission?: string;
  date_creation?: string;
}