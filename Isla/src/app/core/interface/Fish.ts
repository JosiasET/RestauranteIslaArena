export interface Fish {
  id: number | string;  // ✅ Permitir number Y string para IDs offline
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  cantidad: number; // ✅ stock en kg/litros
  
  descripcion_real?: string;
  tiene_tamanos?: boolean;
  tipos?: any[];
  tamanos?: any[];
  
  // ✅ AGREGAR ESTAS PROPIEDADES PARA OFFLINE
  offline?: boolean;
  pendingSync?: boolean;
  tempId?: string;
}