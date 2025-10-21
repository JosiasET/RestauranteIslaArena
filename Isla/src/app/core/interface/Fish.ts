export interface Fish {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  
  descripcion_real?: string;
  tiene_tamanos?: boolean;
  tipos?: any[];
  tamanos?: any[];
}