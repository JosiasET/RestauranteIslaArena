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
  // CAMPOS EXACTOS QUE PIDES AL CLIENTE
  firstName: string = '';
  lastName: string = '';
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
  isOffline: boolean = false;

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

    const horaReservaNum = parseInt(this.horaReserva.split(':')[0]);
    const horaCierreNum = parseInt(this.HORARIO_CIERRE.split(':')[0]);
    
    if (horaReservaNum > (horaCierreNum - this.DURACION_ESTANCIA)) {
      this.capacidadMensaje = `❌ Horario no disponible`;
      this.capacidadDetalle = `El restaurante cierra a las ${this.HORARIO_CIERRE} y la estancia estimada es de ${this.DURACION_ESTANCIA} horas`;
      this.capacidadDisponible = false;
      return;
    }

    this.celebrateService.verificarDisponibilidad(
      this.fechaReserva, 
      this.horaReserva, 
      this.personas
    ).subscribe({
      next: (resultado) => {
        this.capacidadMensaje = resultado.mensaje;
        this.capacidadDetalle = `Capacidad: ${resultado.total_reservado}/${this.CAPACIDAD_MAXIMA} personas`;
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

  esFechaCumpleaniosExacta(): boolean {
    if (!this.fechaNacimiento || !this.fechaReserva) return false;
    
    const fechaReserva = new Date(this.fechaReserva);
    const cumpleanios = new Date(this.fechaNacimiento);
    
    return fechaReserva.getMonth() === cumpleanios.getMonth() && 
           fechaReserva.getDate() === cumpleanios.getDate();
  }

  onSubmit() {
    this.loading = true;

    // VALIDAR CAMPOS REQUERIDOS EXACTOS
    if (!this.firstName || !this.lastName || !this.fechaNacimiento || !this.telefono || 
        !this.fechaReserva || !this.horaReserva || !this.aceptoTerminos) {
      alert('❌ Complete todos los campos obligatorios');
      this.loading = false;
      return;
    }

    // PREPARAR DATOS EXACTOS PARA EL CLIENTE
    const reservaData = {
      firstName: this.firstName,
      lastName: this.lastName,
      fecha_nacimiento: this.fechaNacimiento,
      telefono: this.telefono,
      fecha_preferida: this.fechaReserva,
      hora_preferida: this.horaReserva,
      acepta_verificacion: this.aceptoTerminos,
      cant_people: this.personas,
      ine_verificacion: false,
      estado_verificacion: false
    };

    this.celebrateService.crearCelebracionConValidacion(reservaData).subscribe({
      next: (resultado: any) => {
        if (resultado.success) {
          this.codigoReserva = resultado.data.reservation_code;
          this.esSuCumpleanios = this.esFechaCumpleaniosExacta();
          this.formularioEnviado = true;
          
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
    this.firstName = '';
    this.lastName = '';
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

  getEstadoConexion(): string {
    return this.isOffline ? '📱 Modo offline' : '🌐 En línea';
  }

  sincronizarReservasPendientes() {
    if (!navigator.onLine) {
      alert('📱 No hay conexión a internet para sincronizar');
      return;
    }

    this.celebrateService.sincronizarManual().subscribe({
      next: (resultado) => {
        alert(`✅ Sincronización completada:\n${resultado.exitosas} exitosas\n${resultado.errores} errores`);
        this.cdRef.detectChanges();
      },
      error: (error) => {
        alert(`❌ Error en sincronización: ${error.message}`);
      }
    });
  }
  // En celebrates.ts, agrega estos métodos al final de la clase:

// ✅ AGREGAR ESTOS MÉTODOS FALTANTES
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

// ✅ AGREGAR ESTE MÉTODO TAMBIÉN
forzarActualizacion() {
  this.cdRef.detectChanges();
  console.log("🔄 Vista forzada a actualizar");
}
}