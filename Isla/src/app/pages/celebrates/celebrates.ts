import { Component } from '@angular/core';
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
  aceptoTerminos: boolean = false;

  formularioEnviado: boolean = false;
  esSuCumpleanios: boolean = false;
  loading: boolean = false;
  codigoReserva: string = '';
  minDate: string;

  constructor(private celebrateService: CelebrateService) {
    const hoy = new Date();
    this.minDate = hoy.toISOString().split('T')[0];
    if (hoy.getHours() >= 20) {
      const manana = new Date();
      manana.setDate(hoy.getDate() + 1);
      this.minDate = manana.toISOString().split('T')[0];
    }
  }

  verificarCumpleanios(): boolean {
    if (!this.fechaNacimiento) return false;
    const hoy = new Date();
    const cumpleanios = new Date(this.fechaNacimiento);
    return hoy.getMonth() === cumpleanios.getMonth() && hoy.getDate() === cumpleanios.getDate();
  }

  generarCodigoReserva(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
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

  // === SI PASA LAS VALIDACIONES, SE GUARDA ===
  const reservacion: CelebrateInterface = {
    nombre_completo: this.nombre,
    fecha_nacimiento: this.fechaNacimiento,
    telefono: this.telefono,
    fecha_preferida: this.fechaReserva,
    hora_preferida: this.horaReserva,
    acepta_verificacion: this.aceptoTerminos
  };

  this.celebrateService.crearCelebracion(reservacion).subscribe({
    next: (res) => {
      console.log("✅ Guardado en DB:", res);
      alert("🎉 Registro guardado correctamente. ¡Feliz cumpleaños!");
      this.loading = false;
      this.formularioEnviado = true;
      this.esSuCumpleanios = true;
      this.codigoReserva = this.generarCodigoReserva();
    },
    error: (err) => {
      console.error("❌ Error guardando en DB:", err);
      alert("⚠️ Error al guardar en la base de datos. Revisa la consola.");
      this.loading = false;
    }
  });
}



  agregarACalendario() {
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
    this.aceptoTerminos = false;
    this.codigoReserva = '';
  }
}
