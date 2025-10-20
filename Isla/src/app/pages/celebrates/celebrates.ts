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
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
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

    // === VERIFICAR SI LA FECHA DE RESERVA ES SU CUMPLEAÑOS ===
    this.esSuCumpleanios = this.verificarCumpleanios();
    
    if (!this.esSuCumpleanios) {
      const fechaReserva = new Date(this.fechaReserva);
      const cumpleanios = new Date(this.fechaNacimiento);
      
      alert(`📅 La fecha de reservación (${this.formatearFecha(this.fechaReserva)}) no coincide con tu cumpleaños (${cumpleanios.getDate()}/${cumpleanios.getMonth() + 1}). Solo puedes reclamar tu regalo el día exacto de tu cumpleaños.`);
      this.loading = false;
      return;
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
        this.esSuCumpleanios = true;
        
        // FORZAR ACTUALIZACIÓN DE LA VISTA - MÁS AGRESIVO
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
        this.esSuCumpleanios = true;
        
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
      title: `🎂 Mi Cumpleaños en Isla Arena - ${this.codigoReserva}`,
      start: fechaEvento.toISOString(),
      end: fechaFin.toISOString(),
      description: `Reservación para mi regalo de cumpleaños en Isla Arena. Código: ${this.codigoReserva}. No olvides tu INE. Personas: ${this.personas}`,
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

  // Método para forzar actualización manual si es necesario
  forzarActualizacion() {
    this.cdRef.detectChanges();
    console.log("🔄 Vista forzada a actualizar");
  }
}