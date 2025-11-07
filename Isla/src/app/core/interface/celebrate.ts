// En tu interface/celebrate.ts - Asegúrate de que tenga esto:
export interface CelebrateInterface {
  id_celebracion?: number | string;
  nombre_completo: string;
  fecha_nacimiento: string;
  telefono: string;
  fecha_preferida: string;
  hora_preferida: string;
  acepta_verificacion: boolean;
  reservation?: string;
  cant_people?: number;
  ine_verificacion?: boolean;
  estado_verificacion?: boolean;
  fecha_creacion?: string;
  created_at?: string;
  // Propiedades para modo offline
  offline?: boolean;
  pendingSync?: boolean;
  tempId?: string;
  syncStatus?: 'synced' | 'pending' | 'failed';
  fecha_fin_reserva?: string;
  estado_reserva?: string;
}