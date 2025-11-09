import { CelebrateInterface } from './../../../core/interface/celebrate';
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { Observable, map, Subscription } from 'rxjs';
import { CelebrateService } from '../../../core/service/CelebrateService';

interface Reservacion {
  id: number | string;
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
  id_celebracion?: number | string;
  reservation?: string;
  reservation_code?: string; // ✅ AGREGAR ESTA PROPIEDAD
  cant_people?: number;
  ine_verificacion?: boolean;
  estado_verificacion?: boolean;
  acepta_verificacion?: boolean;
  offline?: boolean;
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

interface HorarioCapacidad {
  hora: string;
  capacidadDisponible: number;
  reservaciones: number;
  personas: number;
  disponible: boolean;
  franjaOcupada: boolean;
}

@Component({
  selector: 'app-up-celebrates-amd',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './up-celebrates-amd.html',
  styleUrls: ['./up-celebrates-amd.css']
})
export class UpCelebratesAmd implements OnInit, OnDestroy {
  reservaciones: Reservacion[] = [];
  reservacionesFiltradas: Reservacion[] = [];
  reservaSeleccionada: Reservacion | null = null;
  isOffline: boolean = false;
  
  // Filtros
  fechaFiltro: string = '';
  estadoFiltro: string = 'todas';
  busqueda: string = '';

  // Formulario nueva reserva - DIVIDIDO EN NOMBRE Y APELLIDO
  mostrarFormulario: boolean = false;
  nuevaReserva: any = {
    firstName: '',           // ✅ NUEVO - Nombre
    lastName: '',            // ✅ NUEVO - Apellido
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

  // CONFIGURACIÓN DE CAPACIDAD
  readonly CAPACIDAD_MAXIMA = 30;
  readonly HORARIO_APERTURA = '10:00';
  readonly HORARIO_CIERRE = '18:00';
  readonly DURACION_PROMEDIO_RESERVA = 3;
  readonly INTERVALO_HORAS = 1;
  
  horariosDisponibles: string[] = [];
  capacidadPorHorario: HorarioCapacidad[] = [];
  fechaCapacidad: string = '';
  mostrarPanelCapacidad: boolean = false;
  
  cargando: boolean = false;

  private subscription: Subscription = new Subscription();

  constructor(
    private celebrateService: CelebrateService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // ✅ VERIFICAR ESTADO OFFLINE/ONLINE
    this.isOffline = !navigator.onLine;
    window.addEventListener('online', () => {
      this.isOffline = false;
      this.cdRef.detectChanges();
    });
    window.addEventListener('offline', () => {
      this.isOffline = true;
      this.cdRef.detectChanges();
    });

    this.cargarReservaciones();
    this.generarHorariosDisponibles();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // GENERAR HORARIOS DISPONIBLES
  generarHorariosDisponibles() {
    this.horariosDisponibles = [];
    const [horaApertura, minutoApertura] = this.HORARIO_APERTURA.split(':').map(Number);
    const [horaCierre, minutoCierre] = this.HORARIO_CIERRE.split(':').map(Number);
    
    let horaActual = horaApertura;
    
    while (horaActual <= (horaCierre - this.DURACION_PROMEDIO_RESERVA)) {
      const horaFormateada = `${horaActual.toString().padStart(2, '0')}:${minutoApertura.toString().padStart(2, '0')}`;
      this.horariosDisponibles.push(horaFormateada);
      horaActual += this.INTERVALO_HORAS;
    }
  }

  // VERIFICAR CAPACIDAD USANDO EL SERVICIO
  verificarCapacidadDisponible(fecha: string, hora: string, personas: number = 1): Observable<{ 
    disponible: boolean, 
    mensaje: string, 
    capacidadActual: number,
    franjaOcupada: boolean 
  }> {
    return this.celebrateService.verificarDisponibilidad(fecha, hora, personas).pipe(
      map(resultado => {
        return {
          disponible: resultado.disponible,
          mensaje: resultado.mensaje,
          capacidadActual: resultado.capacidad_restante,
          franjaOcupada: resultado.total_reservado > 0
        };
      })
    );
  }

  // CALCULAR CAPACIDAD POR FECHA
  calcularCapacidadPorFecha(fecha: string) {
    this.capacidadPorHorario = [];
    this.fechaCapacidad = fecha;

    const verificaciones: Observable<HorarioCapacidad>[] = this.horariosDisponibles.map(hora => {
      return this.verificarCapacidadDisponible(fecha, hora).pipe(
        map(resultado => {
          return {
            hora,
            capacidadDisponible: resultado.capacidadActual,
            reservaciones: 0,
            personas: this.CAPACIDAD_MAXIMA - resultado.capacidadActual,
            disponible: resultado.disponible,
            franjaOcupada: resultado.franjaOcupada
          };
        })
      );
    });

    // Esperar a que todas las verificaciones terminen
    let completadas = 0;
    verificaciones.forEach((verificacion, index) => {
      verificacion.subscribe(capacidad => {
        this.capacidadPorHorario[index] = capacidad;
        completadas++;
        
        if (completadas === verificaciones.length) {
          this.mostrarPanelCapacidad = true;
          this.cdRef.detectChanges();
        }
      });
    });
  }

  cargarReservaciones() {
    this.cargando = true;
    
    this.subscription.add(
      this.celebrateService.celebraciones$.subscribe({
        next: (celebraciones: CelebrateInterface[]) => {
          console.log('📥 Datos recibidos:', celebraciones);
          
          if (celebraciones && celebraciones.length > 0) {
            this.reservaciones = celebraciones.map(celeb => this.celebracionToReservacion(celeb));
          } else {
            this.cargarDesdeLocalStorage();
          }
          
          this.reservacionesFiltradas = [...this.reservaciones];
          this.calcularEstadisticas();
          this.cargando = false;
          this.cdRef.detectChanges();
        },
        error: (error: any) => {
          console.error('❌ Error cargando reservaciones:', error);
          this.cargarDesdeLocalStorage();
          this.cargando = false;
          this.cdRef.detectChanges();
        }
      })
    );

    // Cargar datos iniciales
    this.celebrateService.cargarCelebraciones().subscribe();
  }

  private celebracionToReservacion(celeb: CelebrateInterface): Reservacion {
  const codigo = celeb.reservation_code || celeb.reservation || this.generarCodigoReserva();
  
  let estado: 'pendiente' | 'confirmada' | 'cumplida' | 'cancelada' = 'pendiente';
  if (celeb.estado_verificacion || celeb.verification_status) {
    estado = 'cumplida';
  } else if (celeb.ine_verificacion || celeb.ine_verified) {
    estado = 'confirmada';
  }
  
  // USAR first_name y last_name si están disponibles
  const nombreCompleto = celeb.nombre_completo || 
                        (celeb.first_name && celeb.last_name ? `${celeb.first_name} ${celeb.last_name}` : 'Nombre no disponible');
  
  const reservacion: Reservacion = {
    id: celeb.celebration_id || celeb.id_celebracion || Date.now(),
    id_celebracion: celeb.celebration_id || celeb.id_celebracion,
    codigo: codigo,
    nombre: nombreCompleto,
    fechaNacimiento: celeb.fecha_nacimiento || '2000-01-01',
    telefono: celeb.telefono || 'Sin teléfono',
    fechaReserva: celeb.fecha_preferida || new Date().toISOString().split('T')[0],
    horaReserva: celeb.hora_preferida || '12:00',
    estado: estado,
    ineVerificada: celeb.ine_verificacion || celeb.ine_verified || false,
    fechaCreacion: celeb.fecha_creacion || celeb.created_at || new Date().toISOString(),
    historial: [
      { 
        fecha: new Date(celeb.fecha_creacion || celeb.created_at || new Date()), 
        accion: `Reservación creada para ${celeb.cant_people || celeb.people_count || 1} persona(s)`,
        usuario: 'Sistema'
      }
    ],
    reservation: celeb.reservation,
    reservation_code: celeb.reservation_code, // ✅ AHORA SÍ EXISTE EN LA INTERFACE
    cant_people: celeb.cant_people || celeb.people_count || 1,
    ine_verificacion: celeb.ine_verificacion || celeb.ine_verified || false,
    estado_verificacion: celeb.estado_verificacion || celeb.verification_status || false,
    acepta_verificacion: celeb.acepta_verificacion || false,
    offline: celeb.offline || false
  };
  
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
    } else {
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
        horaReserva: '12:00',
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

  // CREAR RESERVA CON VERIFICACIÓN DE CAPACIDAD
  crearReserva() {
    if (!this.validarFormulario()) {
      return;
    }

    this.cargando = true;
    
    const nombreCompleto = `${this.nuevaReserva.firstName} ${this.nuevaReserva.lastName}`.trim();
    
    const reservacion: CelebrateInterface = {
      first_name: this.nuevaReserva.firstName,      // ✅ Enviar separado
      last_name: this.nuevaReserva.lastName,        // ✅ Enviar separado
      nombre_completo: nombreCompleto,              // ✅ También enviar completo
      fecha_nacimiento: this.nuevaReserva.fecha_nacimiento,
      telefono: this.nuevaReserva.telefono,
      fecha_preferida: this.nuevaReserva.fecha_preferida,
      hora_preferida: this.nuevaReserva.hora_preferida,
      acepta_verificacion: this.nuevaReserva.acepta_verificacion,
      cant_people: this.nuevaReserva.cant_people || 1,
      ine_verificacion: false,
      estado_verificacion: false
    };

     this.celebrateService.crearCelebracionConValidacion(reservacion).subscribe({
      next: (resultado: any) => {
        if (resultado.success) {
          this.mostrarFormulario = false;
          this.limpiarFormulario();
          
          if (this.isOffline) {
            alert(`📱 ${resultado.message}\n\nEsta reserva se sincronizará automáticamente cuando recuperes internet.`);
          } else {
            alert(`✅ ${resultado.message}\n\nCódigo: ${resultado.data.reservation_code}\nPersonas: ${reservacion.cant_people}\nCapacidad restante: ${resultado.capacidad_restante}`);
          }
        }
        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Error creando reserva:', error);
        alert(`❌ ${error.message || 'Error al crear la reserva'}`);
        this.cargando = false;
        this.cdRef.detectChanges();
      }
    });
  }

  private validarFormulario(): boolean {
    const { firstName, lastName, fecha_nacimiento, telefono, fecha_preferida, hora_preferida, cant_people } = this.nuevaReserva;
    
    // ✅ VALIDAR NOMBRE Y APELLIDO SEPARADOS
    if (!firstName?.trim()) {
      alert('El nombre es requerido');
      return false;
    }
    if (!lastName?.trim()) {
      alert('El apellido es requerido');
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
    if (cant_people > 10) {
      alert('❌ No se permiten reservaciones de más de 10 personas por grupo');
      return false;
    }
    
    const horaReserva = parseInt(hora_preferida.split(':')[0]);
    const horaApertura = parseInt(this.HORARIO_APERTURA.split(':')[0]);
    const horaCierre = parseInt(this.HORARIO_CIERRE.split(':')[0]);
    
    if (horaReserva < horaApertura || horaReserva >= horaCierre) {
      alert(`❌ El restaurante solo opera de ${this.HORARIO_APERTURA} a ${this.HORARIO_CIERRE}`);
      return false;
    }
    
    if (horaReserva > (horaCierre - this.DURACION_PROMEDIO_RESERVA)) {
      alert(`❌ No se pueden hacer reservas para las ${hora_preferida} porque el restaurante cierra a las ${this.HORARIO_CIERRE} y la estancia estimada es de ${this.DURACION_PROMEDIO_RESERVA} horas.`);
      return false;
    }
    
    return true;
  }

  private limpiarFormulario() {
    this.nuevaReserva = {
      firstName: '',           // ✅ Limpiar separado
      lastName: '',            // ✅ Limpiar separado
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
    this.mostrarPanelCapacidad = false;
  }

  confirmarReserva(reserva: Reservacion) {
    if (reserva.id_celebracion) {
      this.celebrateService.actualizarVerificacion(Number(reserva.id_celebracion), {
        ine_verificacion: false,
        estado_verificacion: false
      }).subscribe({
        next: (response: any) => {
          reserva.estado = 'confirmada';
          reserva.ine_verificacion = false;
          reserva.estado_verificacion = false;
          this.agregarAlHistorial(reserva, `Reservación confirmada para ${reserva.cant_people || 1} persona(s)`);
          this.actualizarYGuardar(reserva);
          
          // ✅ MENSAJE MEJORADO
          const mensaje = this.isOffline 
            ? `📱 Reservación ${reserva.codigo} confirmada localmente - Se sincronizará cuando haya internet`
            : `✅ Reservación ${reserva.codigo} confirmada para ${reserva.cant_people || 1} persona(s)`;
          alert(mensaje);
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
      alert(`📱 Reservación ${reserva.codigo} confirmada localmente - Se sincronizará cuando haya internet`);
    }
  }

  marcarINEVerificada(reserva: Reservacion) {
    if (reserva.id_celebracion) {
      this.celebrateService.actualizarVerificacion(Number(reserva.id_celebracion), {
        ine_verificacion: true,
        estado_verificacion: false
      }).subscribe({
        next: (response: any) => {
          reserva.ineVerificada = true;
          reserva.ine_verificacion = true;
          reserva.estado_verificacion = false;
          this.agregarAlHistorial(reserva, `INE verificada para ${reserva.cant_people || 1} persona(s)`);
          this.actualizarYGuardar(reserva);
          
          // ✅ MENSAJE MEJORADO
          const mensaje = this.isOffline
            ? `📱 INE verificada localmente para ${reserva.nombre} - Se sincronizará cuando haya internet`
            : `✅ INE verificada para ${reserva.nombre} (${reserva.cant_people || 1} persona(s))`;
          alert(mensaje);
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
      alert(`📱 INE verificada localmente para ${reserva.nombre} - Se sincronizará cuando haya internet`);
    }
  }

  marcarRegaloEntregado(reserva: Reservacion) {
    if (reserva.id_celebracion) {
      this.celebrateService.actualizarVerificacion(Number(reserva.id_celebracion), {
        ine_verificacion: true,
        estado_verificacion: true
      }).subscribe({
        next: (response: any) => {
          reserva.estado = 'cumplida';
          reserva.estado_verificacion = true;
          reserva.ine_verificacion = true;
          reserva.ineVerificada = true;
          this.agregarAlHistorial(reserva, `🎁 Regalo entregado a ${reserva.cant_people || 1} persona(s)`);
          this.actualizarYGuardar(reserva);
          
          // ✅ MENSAJE MEJORADO
          const mensaje = this.isOffline
            ? `📱 Regalo marcado como entregado localmente - Se sincronizará cuando haya internet`
            : `🎁 Regalo entregado a ${reserva.nombre} para ${reserva.cant_people || 1} persona(s)`;
          alert(mensaje);
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
      alert(`📱 Regalo marcado como entregado localmente - Se sincronizará cuando haya internet`);
    }
  }

  cancelarReserva(reserva: Reservacion) {
    if (confirm(`¿Cancelar reservación de ${reserva.nombre} para ${reserva.cant_people || 1} persona(s)?`)) {
      reserva.estado = 'cancelada';
      this.agregarAlHistorial(reserva, `Reservación cancelada para ${reserva.cant_people || 1} persona(s)`);
      this.actualizarYGuardar(reserva);
      
      // ✅ MENSAJE MEJORADO
      const mensaje = this.isOffline
        ? `📱 Reservación cancelada localmente - Se sincronizará cuando haya internet`
        : `Reservación cancelada para ${reserva.cant_people || 1} persona(s)`;
      alert(mensaje);
    }
  }

  eliminarReserva(reserva: Reservacion) {
    if (confirm(`¿Eliminar permanentemente la reservación de ${reserva.nombre} (${reserva.codigo}) para ${reserva.cant_people || 1} persona(s)?\n\n⚠️ Esta acción no se puede deshacer.`)) {
      if (reserva.id_celebracion && typeof reserva.id_celebracion === 'number') {
        this.cargando = true;
        this.celebrateService.eliminarCelebracion(reserva.id_celebracion).subscribe({
          next: (response: any) => {
            this.reservaciones = this.reservaciones.filter(r => r.id !== reserva.id);
            this.reservacionesFiltradas = this.reservacionesFiltradas.filter(r => r.id !== reserva.id);
            this.guardarEnLocalStorage();
            this.calcularEstadisticas();
            this.cargando = false;
            this.cdRef.detectChanges();
          },
          error: (error: any) => {
            this.reservaciones = this.reservaciones.filter(r => r.id !== reserva.id);
            this.reservacionesFiltradas = this.reservacionesFiltradas.filter(r => r.id !== reserva.id);
            this.guardarEnLocalStorage();
            this.calcularEstadisticas();
            this.cargando = false;
            this.cdRef.detectChanges();
          }
        });
      } else {
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

  // MÉTODO PARA VER CAPACIDAD
  verCapacidad() {
    if (!this.fechaFiltro) {
      alert('Seleccione una fecha primero para ver la capacidad');
      return;
    }
    this.calcularCapacidadPorFecha(this.fechaFiltro);
  }

  // ✅ MÉTODO PARA MOSTRAR ESTADO OFFLINE
  getEstadoConexion(): string {
    return this.isOffline ? '📱 Modo offline' : '🌐 En línea';
  }

  // ✅ MÉTODO PARA VER SI UNA RESERVA ES OFFLINE
  esReservaOffline(reserva: Reservacion): boolean {
    return reserva.offline || false;
  }

  // En up-celebrates-amd.ts - AGREGAR
sincronizarManual() {
  this.celebrateService.sincronizarManual().subscribe({
    next: (resultado) => {
      alert(`✅ Sincronización manual completada:\n${resultado.exitosas} exitosas\n${resultado.errores} errores`);
      this.cargarReservaciones();
    },
    error: (error) => {
      alert(`❌ Error en sincronización: ${error.message}`);
    }
  });
}

verDiagnostico() {
  const diagnostico = this.celebrateService.diagnosticarSincronizacion();
  alert(`🔍 Diagnóstico:
Online: ${diagnostico.online ? '✅' : '❌'}
Pendientes: ${diagnostico.pendientes}
Sincronizando: ${diagnostico.sincronizando ? '✅' : '❌'}
Reservas locales: ${diagnostico.celebracionesLocales}
Reservas offline: ${diagnostico.celebracionesOffline}`);
}
}