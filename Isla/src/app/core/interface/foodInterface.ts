export interface foodInterface {
  id?: number;              
  nombre: string;
  descripcion: string;
  descripcion_real?: string;
  precio: number;
  imagen: string;
  tiene_tamanos?: boolean;
  tipos?: any[];
  tamanos?: any[];
}