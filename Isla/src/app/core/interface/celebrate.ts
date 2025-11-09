// En src/app/core/interface/celebrate.ts
export interface CelebrateInterface {
  // IDs
  id_celebracion?: number | string;
  celebration_id?: number | string;
  customer_id?: number;
  user_id?: number;

  // Información personal - ACTUALIZADO
  nombre_completo?: string;  // Hacer opcional
  first_name?: string;       // Agregar
  last_name?: string;        // Agregar
  fecha_nacimiento: string;
  telefono: string;
  email?: string;

  // Información de reserva
  fecha_preferida: string;
  hora_preferida: string;
  acepta_verificacion: boolean;
  reservation?: string;
  reservation_code?: string;
  cant_people?: number;
  people_count?: number;

  // Verificación
  ine_verificacion?: boolean;
  ine_verified?: boolean;
  estado_verificacion?: boolean;
  verification_status?: boolean;
  reservation_status?: string;

  // Dirección
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  extra_references?: string;

  // Fechas
  fecha_creacion?: string;
  created_at?: string;

  // Propiedades para modo offline
  offline?: boolean;
  pendingSync?: boolean;
  tempId?: string;
  syncStatus?: 'synced' | 'pending' | 'failed';
}