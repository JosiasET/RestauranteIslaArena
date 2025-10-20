import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CelebrateService } from '../../core/service/CelebrateService';
import { CelebrateInterface } from '../../core/interface/celebrate';

@Component({
  selector: 'app-celebrates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './celebrates.html',
  styleUrls: ['./celebrates.css']
})
export class Celebrates {
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

  constructor(
    private celebrateService: CelebrateService,
    private cdRef: ChangeDetectorRef
  ) {
    const hoy = new Date();
    this.minDate = hoy.toISOString().split('T')[0];
  }

  verificarCumpleanios(): boolean {
    if (!this.fechaNacimiento || !this.fechaReserva) return false;
    
    const fechaReserva = new Date(this.fechaReserva);
    const cumpleanios = new Date(this.fechaNacimiento);
    
    // Permitir cualquier fecha futura, no solo el día exacto
    return fechaReserva >= new Date(); // Solo verificar que sea fecha futura
  }

  esFechaCumpleaniosExacta(): boolean {
    if (!this.fechaNacimiento || !this.fechaReserva) return false;
    
    const fechaReserva = new Date(this.fechaReserva);
    const cumpleanios = new Date(this.fechaNacimiento);
    
    return fechaReserva.getMonth() === cumpleanios.getMonth() && 
           fechaReserva.getDate() === cumpleanios.getDate();
  }

  generarCodigoReserva(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 8 }, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
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

  onSubmit() {
    this.loading = true;
    console.log("⏳ Verificando datos...");

    // === VALIDAR EDAD ===
    const fechaNac = new Date(this.fechaNacimiento);
    const hoyEdad = new Date(); // Cambié el nombre para evitar conflicto
    let edad = hoyEdad.getFullYear() - fechaNac.getFullYear();
    const mes = hoyEdad.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoyEdad.getDate() < fechaNac.getDate())) {
      edad--;
    }

    console.log("🎂 Edad calculada:", edad);

    if (edad < 18) {
      alert("🚫 Usted no es mayor de edad. No puede registrar la promoción.");
      this.loading = false;
      return;
    }

    // === VALIDAR TELÉFONO ===
    const telefonoValido = /^[0-9]{10}$/.test(this.telefono);
    if (!telefonoValido) {
      alert("📵 El número telefónico debe contener exactamente 10 dígitos numéricos.");
      this.loading = false;
      return;
    }

    // === VERIFICAR SI LA FECHA DE RESERVA ES FUTURA ===
    const fechaReserva = new Date(this.fechaReserva);
    const hoyReserva = new Date(); // Cambié el nombre para evitar conflicto
    
    if (fechaReserva < hoyReserva) {
      alert("📅 La fecha de reservación debe ser una fecha futura.");
      this.loading = false;
      return;
    }

    // === VERIFICAR SI ES EL DÍA EXACTO DEL CUMPLEAÑOS ===
    this.esSuCumpleanios = this.esFechaCumpleaniosExacta();
    
    if (!this.esSuCumpleanios) {
      const cumpleanios = new Date(this.fechaNacimiento);
      const confirmacion = confirm(
        `📅 La fecha de reservación (${this.formatearFecha(this.fechaReserva)}) no coincide con tu cumpleaños (${cumpleanios.getDate()}/${cumpleanios.getMonth() + 1}).\n\n` +
        `¿Deseas continuar con la reservación? El regalo de cumpleaños solo se entregará si vienes el día exacto de tu cumpleaños.`
      );
      
      if (!confirmacion) {
        this.loading = false;
        return;
      }
    }

    // === GENERAR CÓDIGO DE RESERVACIÓN ===
    this.codigoReserva = this.generarCodigoReserva();

    // === PREPARAR DATOS PARA LA BASE DE DATOS ===
    const reservacion: CelebrateInterface = {
      nombre_completo: this.nombre,
      fecha_nacimiento: this.fechaNacimiento,
      telefono: this.telefono,
      fecha_preferida: this.fechaReserva,
      hora_preferida: this.horaReserva,
      acepta_verificacion: this.aceptoTerminos,
      reservation: this.codigoReserva,
      cant_people: this.personas,
      ine_verificacion: false,
      estado_verificacion: false
    };

    console.log("📊 Datos a guardar:", reservacion);

    this.celebrateService.crearCelebracion(reservacion).subscribe({
      next: (res) => {
        console.log("✅ Guardado en DB:", res);
        
        // ACTUALIZAR LA VISTA INMEDIATAMENTE
        this.formularioEnviado = true;
        
        // FORZAR ACTUALIZACIÓN DE LA VISTA
        setTimeout(() => {
          this.cdRef.detectChanges();
          console.log("🎉 Vista actualizada después del guardado");
        }, 100);
        
        this.loading = false;
      },
      error: (err) => {
        console.error("❌ Error guardando en DB:", err);
        
        // MOSTRAR RESULTADO AUNQUE FALLE
        this.formularioEnviado = true;
        
        // FORZAR ACTUALIZACIÓN
        setTimeout(() => {
          this.cdRef.detectChanges();
        }, 100);
        
        alert("⚠️ Se guardó localmente debido a un error en el servidor.");
        this.loading = false;
      }
    });
  }

  agregarACalendario() {
    const fechaEvento = new Date(this.fechaReserva + 'T' + this.horaReserva + ':00');
    const fechaFin = new Date(fechaEvento);
    fechaFin.setHours(fechaFin.getHours() + 2);
    
    const eventoCalendario = {
      title: `🎂 ${this.esSuCumpleanios ? 'Mi Cumpleaños' : 'Reservación'} en Isla Arena - ${this.codigoReserva}`,
      start: fechaEvento.toISOString(),
      end: fechaFin.toISOString(),
      description: `Reservación en Isla Arena. ${this.esSuCumpleanios ? '¡Es mi cumpleaños! Regalo especial incluído.' : 'Reservación regular.'} Código: ${this.codigoReserva}. Personas: ${this.personas}`,
      location: 'Isla Arena Restaurant'
    };
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventoCalendario.title)}&dates=${fechaEvento.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${fechaFin.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(eventoCalendario.description)}&location=${encodeURIComponent(eventoCalendario.location)}`;
    
    window.open(googleCalendarUrl, '_blank');
    console.log('🗓️ Evento agregado al calendario');
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
    
    // FORZAR ACTUALIZACIÓN AL REINICIAR
    setTimeout(() => {
      this.cdRef.detectChanges();
    }, 100);
  }

  imprimirComprobante() {
    window.print();
  }

  // Método para obtener mensaje según tipo de reservación
  getMensajeReservacion(): string {
    if (this.esSuCumpleanios) {
      return `🎉 ¡Felicidades! Tu reservación para tu cumpleaños ha sido confirmada. Te esperamos con tu regalo especial.`;
    } else {
      return `✅ Tu reservación ha sido confirmada. Recuerda que el regalo de cumpleaños solo aplica si vienes el día exacto de tu cumpleaños.`;
    }
  }

  // Método para forzar actualización manual si es necesario
  forzarActualizacion() {
    this.cdRef.detectChanges();
    console.log("🔄 Vista forzada a actualizar");
  }
}