export interface foodInterface {
  id: number | string;  // ✅ Permitir number Y string para IDs offline
  nombre: string;
  descripcion: string;
  descripcion_real?: string;
  precio: number;
  imagen: string;
  tiene_tamanos?: boolean;
  tipos?: any[];
  tamanos?: any[];
  
  // ✅ AGREGAR ESTAS PROPIEDADES PARA OFFLINE
  offline?: boolean;
  pendingSync?: boolean;
  tempId?: string;
}