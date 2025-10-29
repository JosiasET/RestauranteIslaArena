export interface Drinkinterface {
  id: number | string;  // Permitir number Y string para IDs offline
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  cantidad_productos: number;
  
  // ✅ AGREGAR ESTAS PROPIEDADES PARA OFFLINE
  offline?: boolean;
  pendingSync?: boolean;
  tempId?: string;
}