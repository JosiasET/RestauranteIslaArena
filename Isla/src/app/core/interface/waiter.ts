export interface MeseroInterface {
  id: number | string;  // ✅ Permitir string para IDs offline
  nombre: string;
  apellido: string;
  usuario: string;
  contrasena: string;
  rol: string; // 'administrador' o 'cajero'
  turno: string;
  activo: boolean;
  
  // ✅ AGREGAR ESTAS PROPIEDADES PARA OFFLINE
  offline?: boolean;
  pendingSync?: boolean;
  tempId?: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
}