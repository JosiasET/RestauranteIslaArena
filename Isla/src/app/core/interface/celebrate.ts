// src/app/core/interface/celebrate.ts
export interface CelebrateInterface {
  id_celebracion?: number;
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
  created_at?: string;
}