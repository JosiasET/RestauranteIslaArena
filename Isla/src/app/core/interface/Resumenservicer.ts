export interface Venta {
  id: number;
  fecha: Date;
  platillo: string;
  tipo: 'platillo' | 'marisco';
  cantidad: number;
  precio: number;
  personalId: number;
}

export interface Personal {
  id: number;
  nombre: string;
  activo: boolean;
  puesto: string;
}

export interface ResumenVentas {
  totalPlatillos: number;
  totalMariscos: number;
  totalVentas: number;
  ventasPorPeriodo: any[];
  platillosPopulares: any[];
  mariscosPopulares: any[];
}