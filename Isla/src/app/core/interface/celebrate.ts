export interface CelebrateInterface {
  id_celebracion?: number | string;
  nombre_completo: string;
  fecha_nacimiento: string;
  telefono: string;
  fecha_preferida: string;
  hora_preferida: string;
  acepta_verificacion: boolean;
  reservation?: string;
  cant_people: number;
  ine_verificacion: boolean;
  estado_verificacion: boolean;
  
  fecha_fin_reserva?: string;
  estado_reserva?: string;
  fecha_creacion?: string;
  created_at?: string;
  
  // ✅ CORREGIDO - Tipos específicos para syncStatus
  offline?: boolean;
  pendingSync?: boolean;
  tempId?: string;
  syncStatus?: 'pending' | 'synced' | 'failed'; // ✅ Tipo específico
}