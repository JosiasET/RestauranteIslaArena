import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MeseroService } from '../../core/service/WaiterService';
import { MeseroInterface } from '../../core/interface/waiter';

@Component({
  selector: 'app-up-createwaiter-amd',
  // standalone: true, // Asegúrate que tu componente sea standalone si usas imports[]
  imports: [CommonModule, FormsModule],
  templateUrl: './up-createwaiter-amd.html',
  styleUrls: ['./up-createwaiter-amd.css']
})
export class UpCreatewaiterAmd implements OnInit {
  meseros: MeseroInterface[] = [];
  meseroEditando: MeseroInterface | null = null;
  esModoEdicion: boolean = false;

  // Campos del formulario
  nombre: string = '';
  apellido: string = '';
  usuario: string = '';
  contrasena: string = '';
  rol: string = '';
  turno: string = '';

  // NUEVO: Variable para controlar la visibilidad de la contraseña
  showPassword: boolean = false;

  constructor(private meseroService: MeseroService) {}

  ngOnInit() {
    this.meseroService.meseros$.subscribe(meseros => {
      this.meseros = [...meseros].reverse();
    });
  }

  crearMesero() {
    // ... (tu función crearMesero se queda igual)
    if (!this.nombre || !this.apellido || !this.usuario || !this.rol || !this.turno) {
      alert("Por favor, complete todos los campos requeridos.");
      return;
    }
    if (!this.esModoEdicion && !this.contrasena) {
      alert("La contraseña es obligatoria al crear un nuevo mesero.");
      return;
    }
    const meseroData: MeseroInterface = {
      id: this.meseroEditando ? this.meseroEditando.id : 0,
      nombre: this.nombre,
      apellido: this.apellido,
      usuario: this.usuario,
      contrasena: this.contrasena,
      rol: this.rol,
      turno: this.turno,
      activo: this.meseroEditando ? this.meseroEditando.activo : true
    };
    if (this.esModoEdicion && this.meseroEditando) {
      this.meseroService.actualizarMesero(this.meseroEditando, meseroData);
      alert("Mesero actualizado exitosamente");
    } else {
      this.meseroService.crearMesero(meseroData);
      alert("Mesero creado exitosamente");
    }
    this.limpiarFormulario();
  }

  editarMesero(mesero: MeseroInterface) {
    this.meseroEditando = mesero;
    this.esModoEdicion = true;
    
    // Asignación segura de valores para evitar errores con datos viejos
    this.nombre = mesero.nombre || '';
    this.apellido = mesero.apellido || '';
    this.usuario = mesero.usuario || ''; // <-- Esto evita el error si el usuario no existe
    this.contrasena = ''; // La contraseña no se carga al editar por seguridad
    this.rol = mesero.rol || '';
    this.turno = mesero.turno || '';

    window.scrollTo(0, 0);
  }

  // NUEVO: Función para cambiar la visibilidad de la contraseña
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleEstado(mesero: MeseroInterface) {
    this.meseroService.toggleEstado(mesero);
  }

  eliminarMesero(mesero: MeseroInterface) {
    if (confirm("¿Estás seguro de que deseas eliminar a este mesero?")) {
      this.meseroService.eliminarMesero(mesero);
    }
  }

  cancelarEdicion() {
    this.limpiarFormulario();
  }

  private limpiarFormulario() {
    this.nombre = '';
    this.apellido = '';
    this.usuario = '';
    this.contrasena = '';
    this.rol = '';
    this.turno = '';
    this.meseroEditando = null;
    this.esModoEdicion = false;
  }

  getRolText(rol: string): string {
    return rol === 'administrador' ? '👑 Administrador' : '💳 Cajero';
  }

  getTurnoText(turno: string): string {
    if (turno === 'matutino') return '🌅 Matutino';
    if (turno === 'vespertino') return '🌇 Vespertino';
    if (turno === 'completo') return '🌞 Completo';
    return turno;
  }
}