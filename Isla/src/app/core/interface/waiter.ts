export interface MeseroInterface {
  id: number;
  nombre: string;
  apellido: string;
  usuario: string;
  contrasena: string;
  rol: string; // 'administrador' o 'cajero'
  turno: string;
  activo: boolean;
}
