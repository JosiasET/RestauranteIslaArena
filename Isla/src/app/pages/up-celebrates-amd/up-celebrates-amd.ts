import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CelebrateService } from '../../core/service/CelebrateService';
import { CelebrateInterface } from '../../core/interface/celebrate';

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
  id_celebracion?: number;
  reservation?: string;
  cant_people?: number;
  ine_verificacion?: boolean;
  estado_verificacion?: boolean;
  acepta_verificacion?: boolean;
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
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './up-celebrates-amd.html',
  styleUrls: ['./up-celebrates-amd.css']
})
export class UpCelebratesAmd implements OnInit {
  reservaciones: Reservacion[] = [];
  reservacionesFiltradas: Reservacion[] = [];
  reservaSeleccionada: Reservacion | null = null;
  
  // Filtros
  fechaFiltro: string = '';
  estadoFiltro: string = 'todas';
  busqueda: string = '';

  // Formulario nueva reserva
  mostrarFormulario: boolean = false;
  nuevaReserva: any = {
    nombre_completo: '',
    fecha_nacimiento: '',
    telefono: '',
    fecha_preferida: '',
    hora_preferida: '',
    acepta_verificacion: false,
    cant_people: 1
  };

  estadisticas: Estadisticas = {
    hoy: 0,
    pendientes: 0,
    entregados: 0,
    esteMes: 0
  };

  cargando: boolean = false;

  constructor(
    private celebrateService: CelebrateService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarReservaciones();
  }

  cargarReservaciones() {
    this.cargando = true;
    this.celebrateService.obtenerCelebraciones().subscribe({
      next: (celebraciones: CelebrateInterface[]) => {
        console.log('📥 Datos recibidos de BD:', celebraciones);
        
        if (celebraciones && celebraciones.length > 0) {
          this.reservaciones = celebraciones.map(celeb => this.celebracionToReservacion(celeb));
          console.log('🔄 Reservaciones mapeadas:', this.reservaciones);
        } else {
          console.log('📭 No hay datos en BD, cargando desde localStorage');
          this.cargarDesdeLocalStorage();
        }
        
        this.reservacionesFiltradas = [...this.reservaciones];
        this.calcularEstadisticas();
        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Error cargando reservaciones:', error);
        console.log('🔄 Cargando desde localStorage debido a error');
        this.cargarDesdeLocalStorage();
        this.cargando = false;
        this.cdRef.detectChanges();
      }
    });
  }

  private celebracionToReservacion(celeb: CelebrateInterface): Reservacion {
    console.log('🔄 Mapeando celebración:', celeb);
    
    // Generar código si no existe
    const codigo = celeb.reservation || this.generarCodigoReserva();
    
    // Mapear estado correctamente desde la BD
    let estado: 'pendiente' | 'confirmada' | 'cumplida' | 'cancelada' = 'pendiente';
    
    if (celeb.estado_verificacion) {
      estado = 'cumplida';
    } else if (celeb.ine_verificacion) {
      estado = 'confirmada';
    }
    
    // Asegurar que tenemos todos los campos necesarios
    const reservacion: Reservacion = {
      id: celeb.id_celebracion || Date.now(),
      id_celebracion: celeb.id_celebracion,
      codigo: codigo,
      nombre: celeb.nombre_completo || 'Nombre no disponible',
      fechaNacimiento: celeb.fecha_nacimiento || '2000-01-01',
      telefono: celeb.telefono || 'Sin teléfono',
      fechaReserva: celeb.fecha_preferida || new Date().toISOString().split('T')[0],
      horaReserva: celeb.hora_preferida || '12:00',
      estado: estado,
      ineVerificada: celeb.ine_verificacion || false,
      fechaCreacion: celeb.created_at || new Date().toISOString(),
      historial: [
        { 
          fecha: new Date(celeb.created_at || new Date()), 
          accion: `Reservación creada para ${celeb.cant_people || 1} persona(s)`,
          usuario: 'Sistema'
        }
      ],
      reservation: celeb.reservation,
      cant_people: celeb.cant_people || 1,
      ine_verificacion: celeb.ine_verificacion || false,
      estado_verificacion: celeb.estado_verificacion || false,
      acepta_verificacion: celeb.acepta_verificacion || false
    };
    
    console.log('✅ Reservación mapeada:', reservacion);
    return reservacion;
  }

  private generarCodigoReserva(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return 'CEL' + Array.from({ length: 6 }, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }

  private cargarDesdeLocalStorage() {
    const reservacionesGuardadas = localStorage.getItem('reservacionesCumpleanos');
    if (reservacionesGuardadas) {
      this.reservaciones = JSON.parse(reservacionesGuardadas);
      console.log('📂 Datos cargados desde localStorage:', this.reservaciones);
    } else {
      console.log('🆕 Inicializando con datos de prueba');
      this.reservaciones = this.getDatosIniciales();
      this.guardarEnLocalStorage();
    }
  }

  private getDatosIniciales(): Reservacion[] {
    const hoy = this.getHoy();
    return [
      {
        id: 1,
        codigo: 'CEL0001ABC',
        nombre: 'María González',
        fechaNacimiento: '1990-03-15',
        telefono: '555-1234',
        fechaReserva: hoy,
        horaReserva: '19:00',
        estado: 'pendiente',
        ineVerificada: false,
        fechaCreacion: new Date().toISOString(),
        historial: [
          { 
            fecha: new Date(), 
            accion: 'Reservación creada para 2 persona(s)',
            usuario: 'Sistema'
          }
        ],
        cant_people: 2,
        ine_verificacion: false,
        estado_verificacion: false,
        acepta_verificacion: true
      }
    ];
  }

  crearReserva() {
    if (!this.validarFormulario()) {
      return;
    }

    this.cargando = true;
    
    const codigoReserva = this.generarCodigoReserva();
    const cantidadPersonas = this.nuevaReserva.cant_people || 1;
    
    const reservacion: CelebrateInterface = {
      nombre_completo: this.nuevaReserva.nombre_completo,
      fecha_nacimiento: this.nuevaReserva.fecha_nacimiento,
      telefono: this.nuevaReserva.telefono,
      fecha_preferida: this.nuevaReserva.fecha_preferida,
      hora_preferida: this.nuevaReserva.hora_preferida,
      acepta_verificacion: this.nuevaReserva.acepta_verificacion,
      reservation: codigoReserva,
      cant_people: cantidadPersonas,
      ine_verificacion: false,
      estado_verificacion: false
    };

    console.log('💾 Guardando en BD:', reservacion);

    this.celebrateService.crearCelebracion(reservacion).subscribe({
      next: (response: any) => {
        console.log('✅ Guardado en DB:', response);
        
        if (response && response.data) {
          const celebracionCreada = response.data;
          const nuevaReservacion = this.celebracionToReservacion(celebracionCreada);
          
          this.reservaciones.unshift(nuevaReservacion);
          this.reservacionesFiltradas.unshift(nuevaReservacion);
          
          this.guardarEnLocalStorage();
          this.calcularEstadisticas();
          this.mostrarFormulario = false;
          this.limpiarFormulario();
          
          alert(`✅ Reservación creada exitosamente para ${cantidadPersonas} persona(s)`);
        } else {
          this.crearReservacionLocal(codigoReserva, cantidadPersonas);
        }
        
        this.cargando = false;
        this.cdRef.detectChanges();
        setTimeout(() => this.cargarReservaciones(), 1000);
      },
      error: (error: any) => {
        console.error('❌ Error creando reservación:', error);
        this.crearReservacionLocal(codigoReserva, cantidadPersonas);
        this.cargando = false;
        this.cdRef.detectChanges();
      }
    });
  }

  private crearReservacionLocal(codigoReserva: string, cantidadPersonas: number) {
    const nuevaReservacion: Reservacion = {
      id: Date.now(),
      codigo: codigoReserva,
      nombre: this.nuevaReserva.nombre_completo,
      fechaNacimiento: this.nuevaReserva.fecha_nacimiento,
      telefono: this.nuevaReserva.telefono,
      fechaReserva: this.nuevaReserva.fecha_preferida,
      horaReserva: this.nuevaReserva.hora_preferida,
      estado: 'pendiente',
      ineVerificada: false,
      fechaCreacion: new Date().toISOString(),
      historial: [
        { 
          fecha: new Date(), 
          accion: `Reservación creada para ${cantidadPersonas} persona(s)`,
          usuario: 'Sistema'
        }
      ],
      reservation: codigoReserva,
      cant_people: cantidadPersonas,
      ine_verificacion: false,
      estado_verificacion: false,
      acepta_verificacion: this.nuevaReserva.acepta_verificacion
    };

    this.reservaciones.unshift(nuevaReservacion);
    this.reservacionesFiltradas.unshift(nuevaReservacion);
    
    this.guardarEnLocalStorage();
    this.calcularEstadisticas();
    this.mostrarFormulario = false;
    this.limpiarFormulario();
    
    alert(`✅ Reservación creada exitosamente para ${cantidadPersonas} persona(s) (modo local)`);
  }

  private validarFormulario(): boolean {
    const { nombre_completo, fecha_nacimiento, telefono, fecha_preferida, hora_preferida, cant_people } = this.nuevaReserva;
    
    if (!nombre_completo?.trim()) {
      alert('El nombre completo es requerido');
      return false;
    }
    if (!fecha_nacimiento) {
      alert('La fecha de nacimiento es requerida');
      return false;
    }
    if (!telefono?.trim()) {
      alert('El teléfono es requerido');
      return false;
    }
    if (!fecha_preferida) {
      alert('La fecha preferida es requerida');
      return false;
    }
    if (!hora_preferida) {
      alert('La hora preferida es requerida');
      return false;
    }
    if (!cant_people || cant_people < 1) {
      alert('La cantidad de personas debe ser al menos 1');
      return false;
    }
    
    return true;
  }

  private limpiarFormulario() {
    this.nuevaReserva = {
      nombre_completo: '',
      fecha_nacimiento: '',
      telefono: '',
      fecha_preferida: '',
      hora_preferida: '',
      acepta_verificacion: false,
      cant_people: 1
    };
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.limpiarFormulario();
    }
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

  // MÉTODOS ACTUALIZADOS - GUARDAN EN BD
  confirmarReserva(reserva: Reservacion) {
  if (reserva.id_celebracion) {
    this.celebrateService.actualizarVerificacion(reserva.id_celebracion, {
      ine_verificacion: false,    // INE aún no verificada
      estado_verificacion: false  // Estado aún no cumplido
    }).subscribe({
      next: (response: any) => {
        console.log('✅ Confirmación actualizada en BD:', response);
        reserva.estado = 'confirmada';
        reserva.ine_verificacion = false;
        reserva.estado_verificacion = false;
        this.agregarAlHistorial(reserva, `Reservación confirmada para ${reserva.cant_people || 1} persona(s)`);
        this.actualizarYGuardar(reserva);
        alert(`Reservación ${reserva.codigo} confirmada para ${reserva.cant_people || 1} persona(s)`);
      },
      error: (error) => {
        console.error('Error actualizando BD:', error);
        alert('Error al actualizar la base de datos');
      }
    });
  } else {
    reserva.estado = 'confirmada';
    this.agregarAlHistorial(reserva, `Reservación confirmada para ${reserva.cant_people || 1} persona(s)`);
    this.actualizarYGuardar(reserva);
    alert(`Reservación ${reserva.codigo} confirmada para ${reserva.cant_people || 1} persona(s)`);
  }
}

// MÉTODO CORREGIDO PARA VERIFICAR INE
marcarINEVerificada(reserva: Reservacion) {
  if (reserva.id_celebracion) {
    this.celebrateService.actualizarVerificacion(reserva.id_celebracion, {
      ine_verificacion: true,     // INE verificada
      estado_verificacion: false  // Estado aún no cumplido
    }).subscribe({
      next: (response: any) => {
        console.log('✅ INE verificada en BD:', response);
        reserva.ineVerificada = true;
        reserva.ine_verificacion = true;
        reserva.estado_verificacion = false;
        this.agregarAlHistorial(reserva, `INE verificada para ${reserva.cant_people || 1} persona(s)`);
        this.actualizarYGuardar(reserva);
        alert(`✅ INE verificada para ${reserva.nombre} (${reserva.cant_people || 1} persona(s))`);
      },
      error: (error) => {
        console.error('Error actualizando BD:', error);
        alert('Error al actualizar la base de datos');
      }
    });
  } else {
    reserva.ineVerificada = true;
    reserva.ine_verificacion = true;
    this.agregarAlHistorial(reserva, `INE verificada para ${reserva.cant_people || 1} persona(s)`);
    this.actualizarYGuardar(reserva);
    alert(`✅ INE verificada para ${reserva.nombre} (${reserva.cant_people || 1} persona(s))`);
  }
}

// MÉTODO CORREGIDO PARA ENTREGAR REGALO
marcarRegaloEntregado(reserva: Reservacion) {
  if (reserva.id_celebracion) {
    this.celebrateService.actualizarVerificacion(reserva.id_celebracion, {
      ine_verificacion: true,    // INE verificada
      estado_verificacion: true  // Estado cumplido
    }).subscribe({
      next: (response: any) => {
        console.log('✅ Regalo entregado en BD:', response);
        reserva.estado = 'cumplida';
        reserva.estado_verificacion = true;
        reserva.ine_verificacion = true;
        reserva.ineVerificada = true;
        this.agregarAlHistorial(reserva, `🎁 Regalo entregado a ${reserva.cant_people || 1} persona(s)`);
        this.actualizarYGuardar(reserva);
        alert(`🎁 Regalo entregado a ${reserva.nombre} para ${reserva.cant_people || 1} persona(s)`);
      },
      error: (error) => {
        console.error('Error actualizando BD:', error);
        alert('Error al actualizar la base de datos');
      }
    });
  } else {
    reserva.estado = 'cumplida';
    reserva.estado_verificacion = true;
    reserva.ine_verificacion = true;
    reserva.ineVerificada = true;
    this.agregarAlHistorial(reserva, `🎁 Regalo entregado a ${reserva.cant_people || 1} persona(s)`);
    this.actualizarYGuardar(reserva);
    alert(`🎁 Regalo entregado a ${reserva.nombre} para ${reserva.cant_people || 1} persona(s)`);
  }
}

  cancelarReserva(reserva: Reservacion) {
    if (confirm(`¿Cancelar reservación de ${reserva.nombre} para ${reserva.cant_people || 1} persona(s)?`)) {
      reserva.estado = 'cancelada';
      this.agregarAlHistorial(reserva, `Reservación cancelada para ${reserva.cant_people || 1} persona(s)`);
      this.actualizarYGuardar(reserva);
      alert(`Reservación cancelada para ${reserva.cant_people || 1} persona(s)`);
    }
  }

  eliminarReserva(reserva: Reservacion) {
  if (confirm(`¿Eliminar permanentemente la reservación de ${reserva.nombre} (${reserva.codigo}) para ${reserva.cant_people || 1} persona(s)?\n\n⚠️ Esta acción no se puede deshacer.`)) {
    console.log('🗑️ Intentando eliminar reservación:', reserva);
    
    // Si tiene ID de BD, eliminar de la base de datos
    if (reserva.id_celebracion) {
      this.cargando = true;
      this.celebrateService.eliminarCelebracion(reserva.id_celebracion).subscribe({
        next: (response: any) => {
          console.log('✅ Eliminado de BD:', response);
          
          // Eliminar también del array local
          this.reservaciones = this.reservaciones.filter(r => r.id !== reserva.id);
          this.reservacionesFiltradas = this.reservacionesFiltradas.filter(r => r.id !== reserva.id);
          
          this.guardarEnLocalStorage();
          this.calcularEstadisticas();
          this.cargando = false;
          this.cdRef.detectChanges();
    
        },
        error: (error: any) => {
          console.error('❌ Error eliminando de BD:', error);
          
          // Si falla la eliminación en BD, eliminar solo localmente
          this.reservaciones = this.reservaciones.filter(r => r.id !== reserva.id);
          this.reservacionesFiltradas = this.reservacionesFiltradas.filter(r => r.id !== reserva.id);
          
          this.guardarEnLocalStorage();
          this.calcularEstadisticas();
          this.cargando = false;
          this.cdRef.detectChanges();
          
          
        }
      });
    } else {
      // Si no tiene ID de BD, eliminar solo localmente
      this.reservaciones = this.reservaciones.filter(r => r.id !== reserva.id);
      this.reservacionesFiltradas = this.reservacionesFiltradas.filter(r => r.id !== reserva.id);
      
      this.guardarEnLocalStorage();
      this.calcularEstadisticas();
      this.cdRef.detectChanges();
      
      
    }
  }
}

  private actualizarYGuardar(reservaActualizada: Reservacion) {
    const index = this.reservaciones.findIndex(r => r.id === reservaActualizada.id);
    if (index !== -1) {
      this.reservaciones[index] = { ...reservaActualizada };
    }
    
    const indexFiltrado = this.reservacionesFiltradas.findIndex(r => r.id === reservaActualizada.id);
    if (indexFiltrado !== -1) {
      this.reservacionesFiltradas[indexFiltrado] = { ...reservaActualizada };
    }
    
    this.guardarEnLocalStorage();
    this.calcularEstadisticas();
    this.cdRef.detectChanges();
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

  formatearFecha(fecha: string): string {
    const opciones: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(fecha).toLocaleDateString('es-ES', opciones);
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

  private guardarEnLocalStorage() {
    localStorage.setItem('reservacionesCumpleanos', JSON.stringify(this.reservaciones));
  }

  // MÉTODO PARA LIMPIAR DATOS DE PRUEBA
  limpiarDatosPrueba() {
    if (confirm('¿Eliminar todos los datos de prueba del localStorage?')) {
      localStorage.removeItem('reservacionesCumpleanos');
      this.reservaciones = [];
      this.reservacionesFiltradas = [];
      this.calcularEstadisticas();
      this.cdRef.detectChanges();
      alert('Datos limpiados del localStorage. Recarga la página para ver datos de BD.');
      setTimeout(() => this.cargarReservaciones(), 1000);
    }
  }
}