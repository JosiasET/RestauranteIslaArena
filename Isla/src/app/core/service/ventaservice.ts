import { Injectable } from '@angular/core';
import { Personal, ResumenVentas, Venta } from '../interface/Resumenservicer';



@Injectable({
  providedIn: 'root'
})
export class VentasService {
  private ventas: Venta[] = [
    { id: 1, fecha: new Date(2024, 0, 15), platillo: 'Tacos al Pastor', tipo: 'platillo', cantidad: 25, precio: 120, personalId: 1 },
    { id: 2, fecha: new Date(2024, 0, 15), platillo: 'Camarones', tipo: 'marisco', cantidad: 15, precio: 180, personalId: 2 },
    { id: 3, fecha: new Date(2024, 0, 15), platillo: 'Enchiladas', tipo: 'platillo', cantidad: 18, precio: 90, personalId: 1 },
    { id: 4, fecha: new Date(2024, 0, 14), platillo: 'Pulpo', tipo: 'marisco', cantidad: 12, precio: 220, personalId: 3 },
    { id: 5, fecha: new Date(2024, 0, 14), platillo: 'Quesadillas', tipo: 'platillo', cantidad: 30, precio: 60, personalId: 2 },
    { id: 6, fecha: new Date(2024, 0, 14), platillo: 'Ceviche', tipo: 'marisco', cantidad: 20, precio: 150, personalId: 1 },
    { id: 7, fecha: new Date(2024, 0, 13), platillo: 'Tacos al Pastor', tipo: 'platillo', cantidad: 22, precio: 120, personalId: 3 },
    { id: 8, fecha: new Date(2024, 0, 13), platillo: 'Langosta', tipo: 'marisco', cantidad: 8, precio: 350, personalId: 2 },
  ];

  private personal: Personal[] = [
    { id: 1, nombre: 'María González', activo: true, puesto: 'Chef' },
    { id: 2, nombre: 'Juan Pérez', activo: true, puesto: 'Mesero' },
    { id: 3, nombre: 'Carlos López', activo: false, puesto: 'Ayudante' },
    { id: 4, nombre: 'Ana Martínez', activo: true, puesto: 'Cajera' },
  ];

  getResumen(fecha: Date): ResumenVentas {
    const ventasDelDia = this.ventas.filter(v => 
      v.fecha.toDateString() === fecha.toDateString()
    );

    const totalPlatillos = ventasDelDia
      .filter(v => v.tipo === 'platillo')
      .reduce((sum, v) => sum + (v.cantidad * v.precio), 0);

    const totalMariscos = ventasDelDia
      .filter(v => v.tipo === 'marisco')
      .reduce((sum, v) => sum + (v.cantidad * v.precio), 0);

    // Platillos más vendidos
    const platillosMap = new Map();
    ventasDelDia
      .filter(v => v.tipo === 'platillo')
      .forEach(v => {
        platillosMap.set(v.platillo, (platillosMap.get(v.platillo) || 0) + v.cantidad);
      });
    
    const platillosPopulares = Array.from(platillosMap, ([name, value]) => ({ name, value }));

    // Mariscos más vendidos
    const mariscosMap = new Map();
    ventasDelDia
      .filter(v => v.tipo === 'marisco')
      .forEach(v => {
        mariscosMap.set(v.platillo, (mariscosMap.get(v.platillo) || 0) + v.cantidad);
      });
    
    const mariscosPopulares = Array.from(mariscosMap, ([name, value]) => ({ name, value }));

    return {
      totalPlatillos,
      totalMariscos,
      totalVentas: totalPlatillos + totalMariscos,
      ventasPorPeriodo: this.getVentasPorPeriodo(fecha),
      platillosPopulares,
      mariscosPopulares
    };
  }

  getVentasPorPeriodo(fecha: Date): any[] {
    // Simular datos por periodo (hora del día)
    return [
      { name: '08:00-10:00', value: 1500 },
      { name: '10:00-12:00', value: 3200 },
      { name: '12:00-14:00', value: 5800 },
      { name: '14:00-16:00', value: 4200 },
      { name: '16:00-18:00', value: 3100 },
      { name: '18:00-20:00', value: 6500 },
      { name: '20:00-22:00', value: 4800 },
    ];
  }

  getPersonal(): Personal[] {
    return this.personal;
  }

  getVentasPorFecha(fecha: Date): Venta[] {
    return this.ventas.filter(v => v.fecha.toDateString() === fecha.toDateString());
  }
}