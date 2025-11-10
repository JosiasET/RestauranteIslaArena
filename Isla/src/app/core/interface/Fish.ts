// En core/interface/Fish.ts - AGREGAR product_quantity
export interface Fish {
  id: number | string;
  nombre: string;
  descripcion: string;
  descripcion_real?: string;
  precio: number;
  imagen: string;
  cantidad: number; // Stock en el frontend
  product_quantity?: number; // ✅ NUEVO: Stock para el backend
  tiene_tamanos?: boolean;
  tipos?: string[];
  tamanos?: any[];
  offline?: boolean; // Para modo offline
}