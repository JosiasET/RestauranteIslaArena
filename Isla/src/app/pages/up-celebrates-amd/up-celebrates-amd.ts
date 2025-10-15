import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Reservacion {
  id: number;
  codigo: string;
  nombre: string;
  fechaNacimiento: string;
  telefono: string;
  fechaReserva: string;
  horaReserva: string;
  estado: 'pendiente' | 'confirmada' | 'cumplida' | 'cancelada';
  ineVerificada: boolean;
  fechaCreacion: string;
  historial: HistorialEvento[];
}

interface HistorialEvento {
  fecha: Date;
  accion: string;
  usuario?: string;
}

interface Estadisticas {
  hoy: number;
  pendientes: number;
  entregados: number;
  esteMes: number;
}

@Component({
  selector: 'app-up-celebrates-amd',
  imports: [CommonModule, FormsModule],
  templateUrl: './up-celebrates-amd.html',
  styleUrl: './up-celebrates-amd.css'
})
export class UpCelebratesAmd implements OnInit {
  reservaciones: Reservacion[] = [];
  reservacionesFiltradas: Reservacion[] = [];
  reservaSeleccionada: Reservacion | null = null;
  
  // Filtros
  fechaFiltro: string = '';
  estadoFiltro: string = 'todas';
  busqueda: string = '';

  estadisticas: Estadisticas = {
    hoy: 0,
    pendientes: 0,
    entregados: 0,
    esteMes: 0
  };

  // Variable para controlar si ya se cargaron los datos
  private datosCargados: boolean = false;

  ngOnInit() {
    this.cargarReservaciones();
  }

  cargarReservaciones() {
    // Verificar si ya cargamos datos para evitar duplicados
    if (this.datosCargados) {
      return;
    }

    // Cargar desde localStorage o usar datos iniciales
    const reservacionesGuardadas = localStorage.getItem('reservacionesCumpleanos');
    
    if (reservacionesGuardadas) {
      // Cargar reservaciones existentes
      this.reservaciones = JSON.parse(reservacionesGuardadas);
    } else {
      // Datos iniciales de ejemplo (solo una vez)
      this.reservaciones = this.getDatosIniciales();
      this.guardarEnLocalStorage();
    }

    this.datosCargados = true;
    this.reservacionesFiltradas = [...this.reservaciones];
    this.calcularEstadisticas();
  }

  private getDatosIniciales(): Reservacion[] {
    const hoy = this.getHoy();
    return [
      {
        id: 1,
        codigo: 'ABC12345',
        nombre: 'María González',
        fechaNacimiento: '1990-03-15',
        telefono: '555-1234',
        fechaReserva: hoy,
        horaReserva: '19:00',
        estado: 'confirmada',
        ineVerificada: false,
        fechaCreacion: new Date().toISOString(),
        historial: [
          { fecha: new Date(), accion: 'Reservación creada por el cliente' }
        ]
      },
      {
        id: 2,
        codigo: 'DEF67890',
        nombre: 'Carlos López',
        fechaNacimiento: '1985-03-15',
        telefono: '555-5678',
        fechaReserva: hoy,
        horaReserva: '14:00',
        estado: 'pendiente',
        ineVerificada: false,
        fechaCreacion: new Date().toISOString(),
        historial: [
          { fecha: new Date(), accion: 'Reservación creada por el cliente' }
        ]
      }
    ];
  }

  private guardarEnLocalStorage() {
    localStorage.setItem('reservacionesCumpleanos', JSON.stringify(this.reservaciones));
  }

  // Método para que el formulario del cliente agregue nuevas reservaciones
  agregarNuevaReservacion(nuevaReserva: any) {
    const reservacion: Reservacion = {
      id: Date.now(),
      codigo: nuevaReserva.codigo,
      nombre: nuevaReserva.nombre,
      fechaNacimiento: nuevaReserva.fechaNacimiento,
      telefono: nuevaReserva.telefono,
      fechaReserva: nuevaReserva.fechaReserva,
      horaReserva: nuevaReserva.horaReserva,
      estado: 'pendiente', // Siempre empieza como pendiente
      ineVerificada: false,
      fechaCreacion: new Date().toISOString(),
      historial: [
        { 
          fecha: new Date(), 
          accion: 'Reservación creada por el cliente',
          usuario: 'Sistema'
        }
      ]
    };

    this.reservaciones.unshift(reservacion); // Agregar al inicio
    this.reservacionesFiltradas.unshift(reservacion);
    this.guardarEnLocalStorage();
    this.calcularEstadisticas();
    
    console.log('Nueva reservación agregada:', reservacion);
  }

  filtrarReservaciones() {
    this.reservacionesFiltradas = this.reservaciones.filter(reserva => {
      const coincideFecha = !this.fechaFiltro || reserva.fechaReserva === this.fechaFiltro;
      const coincideEstado = this.estadoFiltro === 'todas' || reserva.estado === this.estadoFiltro;
      const coincideBusqueda = !this.busqueda || 
        reserva.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        reserva.codigo.toLowerCase().includes(this.busqueda.toLowerCase());
      
      return coincideFecha && coincideEstado && coincideBusqueda;
    });
  }

  calcularEstadisticas() {
    const hoy = this.getHoy();
    const mesActual = new Date().getMonth();
    
    this.estadisticas = {
      hoy: this.reservaciones.filter(r => r.fechaReserva === hoy && r.estado !== 'cancelada').length,
      pendientes: this.reservaciones.filter(r => r.estado === 'pendiente').length,
      entregados: this.reservaciones.filter(r => r.estado === 'cumplida').length,
      esteMes: this.reservaciones.filter(r => {
        const fechaReserva = new Date(r.fechaReserva);
        return fechaReserva.getMonth() === mesActual && r.estado === 'cumplida';
      }).length
    };
  }

  verDetalles(reserva: Reservacion) {
    this.reservaSeleccionada = reserva;
  }

  cerrarModal() {
    this.reservaSeleccionada = null;
  }

  confirmarReserva(reserva: Reservacion) {
    reserva.estado = 'confirmada';
    this.agregarAlHistorial(reserva, 'Reservación confirmada por administrador');
    this.guardarEnLocalStorage();
    this.calcularEstadisticas();
    alert(`Reservación ${reserva.codigo} confirmada`);
  }

  marcarINEVerificada(reserva: Reservacion) {
    reserva.ineVerificada = true;
    this.agregarAlHistorial(reserva, 'INE verificada correctamente');
    this.guardarEnLocalStorage();
    alert(`INE verificada para ${reserva.nombre}`);
  }

  marcarRegaloEntregado(reserva: Reservacion) {
    reserva.estado = 'cumplida';
    this.agregarAlHistorial(reserva, 'Regalo de cumpleaños entregado');
    this.guardarEnLocalStorage();
    this.calcularEstadisticas();
    alert(`Regalo entregado a ${reserva.nombre}`);
  }

  cancelarReserva(reserva: Reservacion) {
    if (confirm(`¿Cancelar reservación de ${reserva.nombre}?`)) {
      reserva.estado = 'cancelada';
      this.agregarAlHistorial(reserva, 'Reservación cancelada por administrador');
      this.guardarEnLocalStorage();
      this.calcularEstadisticas();
      alert('Reservación cancelada');
    }
  }

  esHoy(fecha: string): boolean {
    return fecha === this.getHoy();
  }

  getEstadoText(estado: string): string {
    const estados: { [key: string]: string } = {
      'pendiente': '⏳ Pendiente',
      'confirmada': '✅ Confirmada',
      'cumplida': '🎁 Cumplida',
      'cancelada': '❌ Cancelada'
    };
    return estados[estado] || estado;
  }

  private agregarAlHistorial(reserva: Reservacion, accion: string) {
    if (!reserva.historial) {
      reserva.historial = [];
    }
    reserva.historial.unshift({
      fecha: new Date(),
      accion: accion,
      usuario: 'Administrador'
    });
  }

  private getHoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Método para limpiar datos de prueba (opcional)
  limpiarDatosPrueba() {
    if (confirm('¿Eliminar todos los datos de prueba?')) {
      localStorage.removeItem('reservacionesCumpleanos');
      this.datosCargados = false;
      this.reservaciones = [];
      this.reservacionesFiltradas = [];
      this.calcularEstadisticas();
      alert('Datos limpiados');
    }
  }
}