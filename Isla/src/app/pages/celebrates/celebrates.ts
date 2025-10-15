import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-celebrates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './celebrates.html',
  styleUrl: './celebrates.css'
})
export class Celebrates {
  // Información del cliente
  nombre: string = '';
  fechaNacimiento: string = '';
  telefono: string = '';
  fechaReserva: string = '';
  horaReserva: string = '';
  aceptoTerminos: boolean = false;

  // Estado del formulario
  formularioEnviado: boolean = false;
  esSuCumpleanios: boolean = false;
  loading: boolean = false;
  codigoReserva: string = '';

  // Fecha mínima para reservación (hoy)
  minDate: string;

  // Regalo de cumpleaños
  regalo = {
    platillo: 'Coctel de Camarón Premium',
    bebida: 'Margarita Especial de la Casa',
    postre: 'Postre sorpresa',
    descripcion: 'Delicioso coctel de camarones con salsa especial acompañado de nuestra bebida signature'
  };

  constructor() {
    // Establecer fecha mínima como hoy
    const hoy = new Date();
    this.minDate = hoy.toISOString().split('T')[0];
    
    // Si ya es después de las 8 PM, permitir reservar desde mañana
    if (hoy.getHours() >= 20) {
      const manana = new Date();
      manana.setDate(hoy.getDate() + 1);
      this.minDate = manana.toISOString().split('T')[0];
    }
  }

  verificarCumpleanios() {
    if (!this.fechaNacimiento) return false;
    
    const hoy = new Date();
    const cumpleanios = new Date(this.fechaNacimiento);
    
    return hoy.getMonth() === cumpleanios.getMonth() && 
           hoy.getDate() === cumpleanios.getDate();
  }

  generarCodigoReserva(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 8; i++) {
      codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return codigo;
  }

  onSubmit() {
    this.loading = true;
    
    // Simular verificación y reservación
    setTimeout(() => {
      this.esSuCumpleanios = this.verificarCumpleanios();
      this.formularioEnviado = true;
      this.loading = false;
      
      if (this.esSuCumpleanios) {
        this.codigoReserva = this.generarCodigoReserva();
        console.log('🎉 Reservación confirmada. Código:', this.codigoReserva);
        
        // Aquí normalmente enviarías los datos a tu backend
        this.guardarReservacionEnLocalStorage();
      }
    }, 2000);
  }

  private guardarReservacionEnLocalStorage() {
    const reservacion = {
      codigo: this.codigoReserva,
      nombre: this.nombre,
      fechaNacimiento: this.fechaNacimiento,
      telefono: this.telefono,
      fechaReserva: this.fechaReserva,
      horaReserva: this.horaReserva,
      timestamp: new Date().toISOString()
    };
    
    // Guardar en localStorage
    localStorage.setItem('reservacionCumpleanos', JSON.stringify(reservacion));
    console.log('Reservación guardada localmente');
  }

  agregarACalendario() {
    // Lógica simple para agregar a calendario
    const fechaReserva = new Date(this.fechaReserva + 'T' + this.horaReserva);
    //alert(`📅 Evento agregado para: ${fechaReserva.toLocaleString()}`);
  }

  reiniciarFormulario() {
    this.formularioEnviado = false;
    this.esSuCumpleanios = false;
    this.nombre = '';
    this.fechaNacimiento = '';
    this.telefono = '';
    this.fechaReserva = '';
    this.horaReserva = '';
    this.aceptoTerminos = false;
    this.codigoReserva = '';
  }
}