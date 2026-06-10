export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface Profil {
  role: 'superadmin' | 'admin' | 'gestionnaire';
  telephone: string;
  est_actif: boolean;
  date_creation: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profil: Profil;
}