export interface Contribuable {
  id?: number;
  nom: string;
  prenom: string;
  nif: string;
  type_contribuable: 'particulier' | 'entreprise';
  adresse: string;
  telephone: string;
  email: string;
  date_enregistrement?: string;
}