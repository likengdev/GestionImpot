export interface DashboardData {
  contribuables_enregistres: number;
  total_impots_collectes: number;
  impots_impayes: number;
  penalites_en_retard: number;
  activite_recente: ActivityItem[];
}

export interface ActivityItem {
  type: string;
  message: string;
  statut: string;
  date: string;
}

export interface RevenusMensuelData {
  labels: string[];
  data: number[];
  annee: number;
}