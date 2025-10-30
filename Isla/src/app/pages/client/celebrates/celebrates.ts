import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CelebrateService } from '../../../core/service/CelebrateService';

@Component({
  selector: 'app-celebrates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './celebrates.html',
  styleUrls: ['./celebrates.css']
})
export class Celebrates implements OnInit, OnDestroy {
  nombre: string = '';
  fechaNacimiento: string = '';
  telefono: string = '';
  fechaReserva: string = '';
  horaReserva: string = '';
  personas: number = 1;
  aceptoTerminos: boolean = false;
  formularioEnviado: boolean = false;
  esSuCumpleanios: boolean = false;
  loading: boolean = false;
  codigoReserva: string = '';
  minDate: string;
  isOffline: boolean = false; // ✅ NUEVA PROPIEDAD

  // CONFIGURACIÓN DE CAPACIDAD
  readonly CAPACIDAD_MAXIMA = 30;
  readonly HORARIO_APERTURA = '10:00';
  readonly HORARIO_CIERRE = '18:00';
  readonly DURACION_ESTANCIA = 3;
  
  horariosDisponibles: string[] = [];
  capacidadMensaje: string = '';
  capacidadDetalle: string = '';
  capacidadDisponible: boolean = true;

  private subscription: Subscription = new Subscription();

  constructor(
    private celebrateService: CelebrateService,
    private cdRef: ChangeDetectorRef
  ) {
    const hoy = new Date();
    this.minDate = hoy.toISOString().split('T')[0];
    this.generarHorariosDisponibles();
  }

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
    
    while (horaActual <= (horaCierre - this.DURACION_ESTANCIA)) {
      const horaFormateada = `${horaActual.toString().padStart(2, '0')}:${minutoApertura.toString().padStart(2, '0')}`;
      this.horariosDisponibles.push(horaFormateada);
      horaActual += 1;
    }
  }

  // VERIFICAR DISPONIBILIDAD EN TIEMPO REAL
  verificarDisponibilidad() {
    if (!this.fechaReserva || !this.horaReserva || !this.personas) {
      this.capacidadMensaje = 'Seleccione fecha, hora y número de personas';
      this.capacidadDetalle = '';
      this.capacidadDisponible = false;
      return;
    }

    if (this.personas > 10) {
      this.capacidadMensaje = '❌ Máximo 10 personas por reservación';
      this.capacidadDetalle = 'Los grupos grandes deben hacer múltiples reservaciones';
      this.capacidadDisponible = false;
      return;
    }

    // Verificar que la hora permita la estancia completa
    const horaReservaNum = parseInt(this.horaReserva.split(':')[0]);
    const horaCierreNum = parseInt(this.HORARIO_CIERRE.split(':')[0]);
    
    if (horaReservaNum > (horaCierreNum - this.DURACION_ESTANCIA)) {
      this.capacidadMensaje = `❌ Horario no disponible`;
      this.capacidadDetalle = `El restaurante cierra a las ${this.HORARIO_CIERRE} y la estancia estimada es de ${this.DURACION_ESTANCIA} horas`;
      this.capacidadDisponible = false;
      return;
    }

    // USAR EL SERVICIO ACTUALIZADO
    this.celebrateService.verificarDisponibilidad(
      this.fechaReserva, 
      this.horaReserva, 
      this.personas
    ).subscribe({
      next: (resultado) => {
        this.capacidadMensaje = resultado.mensaje;
        this.capacidadDetalle = `Capacidad: ${resultado.totalReservado}/${this.CAPACIDAD_MAXIMA} personas`;
        this.capacidadDisponible = resultado.disponible;
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Error verificando capacidad:', error);
        this.capacidadMensaje = this.isOffline 
          ? '📱 Verificación offline - Capacidad disponible' 
          : '⚠️ Verificación limitada';
        this.capacidadDetalle = 'Capacidad disponible (modo seguro)';
        this.capacidadDisponible = true;
        this.cdRef.detectChanges();
      }
    });
  }

  verificarCumpleanios(): boolean {
    if (!this.fechaNacimiento || !this.fechaReserva) return false;
    
    const fechaReserva = new Date(this.fechaReserva);
    const cumpleanios = new Date(this.fechaNacimiento);
    
    return fechaReserva >= new Date();
  }

  esFechaCumpleaniosExacta(): boolean {
    if (!this.fechaNacimiento || !this.fechaReserva) return false;
    
    const fechaReserva = new Date(this.fechaReserva);
    const cumpleanios = new Date(this.fechaNacimiento);
    
    return fechaReserva.getMonth() === cumpleanios.getMonth() && 
           fechaReserva.getDate() === cumpleanios.getDate();
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

  formatearHora(hora: string): string {
    const [horas, minutos] = hora.split(':');
    const horaNum = parseInt(horas);
    const periodo = horaNum >= 12 ? 'PM' : 'AM';
    const hora12 = horaNum % 12 || 12;
    return `${hora12}:${minutos} ${periodo}`;
  }

  // MÉTODO ONSUBMIT CORREGIDO
  onSubmit() {
    this.loading = true;

    // VALIDAR CAMPOS REQUERIDOS
    if (!this.nombre || !this.fechaNacimiento || !this.telefono || 
        !this.fechaReserva || !this.horaReserva || !this.aceptoTerminos) {
      alert('❌ Complete todos los campos obligatorios');
      this.loading = false;
      return;
    }

    // USAR EL SERVICIO CON VALIDACIÓN EN BACKEND
    this.celebrateService.crearCelebracionConValidacion({
      nombre_completo: this.nombre,
      fecha_nacimiento: this.fechaNacimiento,
      telefono: this.telefono,
      fecha_preferida: this.fechaReserva,
      hora_preferida: this.horaReserva,
      acepta_verificacion: this.aceptoTerminos,
      cant_people: this.personas,
      ine_verificacion: false,
      estado_verificacion: false
    }).subscribe({
      next: (resultado: any) => {
        if (resultado.success) {
          // RESERVA EXITOSA
          this.codigoReserva = resultado.data.reservation;
          this.esSuCumpleanios = this.esFechaCumpleaniosExacta();
          this.formularioEnviado = true;
          
          // ✅ MENSAJE MEJORADO
          if (this.isOffline) {
            alert(`📱 ${resultado.message}\n\nEsta reserva se sincronizará automáticamente cuando recuperes internet.`);
          } else {
            alert(`✅ ${resultado.message}`);
          }
        }
        this.loading = false;
        this.cdRef.detectChanges();
      },
      error: (error: any) => {
        console.error('Error en reserva:', error);
        alert(`❌ ${error.message || 'Error al procesar la reserva'}`);
        this.loading = false;
        this.cdRef.detectChanges();
      }
    });
  }

  agregarACalendario() {
    const fechaEvento = new Date(this.fechaReserva + 'T' + this.horaReserva + ':00');
    const fechaFin = new Date(fechaEvento);
    fechaFin.setHours(fechaFin.getHours() + this.DURACION_ESTANCIA);
    
    const eventoCalendario = {
      title: `🎂 ${this.esSuCumpleanios ? 'Mi Cumpleaños' : 'Reservación'} en Isla Arena - ${this.codigoReserva}`,
      start: fechaEvento.toISOString(),
      end: fechaFin.toISOString(),
      description: `Reservación en Isla Arena. ${this.esSuCumpleanios ? '¡Es mi cumpleaños! Regalo especial incluído.' : 'Reservación regular.'} Código: ${this.codigoReserva}. Personas: ${this.personas}. Duración estimada: ${this.DURACION_ESTANCIA} horas`,
      location: 'Isla Arena Restaurant'
    };
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventoCalendario.title)}&dates=${fechaEvento.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${fechaFin.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(eventoCalendario.description)}&location=${encodeURIComponent(eventoCalendario.location)}`;
    
    window.open(googleCalendarUrl, '_blank');
  }

  reiniciarFormulario() {
    this.formularioEnviado = false;
    this.esSuCumpleanios = false;
    this.nombre = '';
    this.fechaNacimiento = '';
    this.telefono = '';
    this.fechaReserva = '';
    this.horaReserva = '';
    this.personas = 1;
    this.aceptoTerminos = false;
    this.codigoReserva = '';
    this.loading = false;
    this.capacidadMensaje = '';
    this.capacidadDetalle = '';
    this.capacidadDisponible = true;
    
    setTimeout(() => {
      this.cdRef.detectChanges();
    }, 100);
  }

  imprimirComprobante() {
    window.print();
  }

  getMensajeReservacion(): string {
    if (this.esSuCumpleanios) {
      return `🎉 ¡Felicidades! Tu reservación para tu cumpleaños ha sido confirmada. Te esperamos con tu regalo especial.\n\n⏱️ Duración estimada: ${this.DURACION_ESTANCIA} horas`;
    } else {
      return `✅ Tu reservación ha sido confirmada. Recuerda que el regalo de cumpleaños solo aplica si vienes el día exacto de tu cumpleaños.\n\n⏱️ Duración estimada: ${this.DURACION_ESTANCIA} horas`;
    }
  }

  forzarActualizacion() {
    this.cdRef.detectChanges();
    console.log("🔄 Vista forzada a actualizar");
  }

  // ✅ MÉTODO PARA MOSTRAR ESTADO OFFLINE
  getEstadoConexion(): string {
    return this.isOffline ? '📱 Modo offline' : '🌐 En línea';
  }
}