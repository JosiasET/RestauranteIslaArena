import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  usuario: string;
  contrasena: string;
  rol: string; // 'administrador' o 'cajero'
  turno: string;
  activo: boolean;
}

@Component({
  selector: 'app-up-createwaiter-amd',
  imports: [CommonModule, FormsModule],
  templateUrl: './up-createwaiter-amd.html',
  styleUrl: './up-createwaiter-amd.css'
})
export class UpCreatewaiterAmd implements OnInit {
  usuarios: Usuario[] = [];
  usuarioEditando: Usuario | null = null;
  esModoEdicion: boolean = false;

  // Campos del formulario
  nombre: string = '';
  apellido: string = '';
  usuario: string = '';
  contrasena: string = '';
  rol: string = '';
  turno: string = '';

  ngOnInit() {
    // Cargar usuarios existentes
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    // Temporal: datos de ejemplo
    this.usuarios = [
      {
        id: 1,
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        usuario: 'carlos.admin',
        contrasena: '*****',
        rol: 'administrador',
        turno: 'completo',
        activo: true
      },
      {
        id: 2,
        nombre: 'Ana',
        apellido: 'García',
        usuario: 'ana.cajero',
        contrasena: '*****',
        rol: 'cajero',
        turno: 'matutino',
        activo: true
      },
      {
        id: 3,
        nombre: 'Luis',
        apellido: 'Martínez',
        usuario: 'luis.cajero',
        contrasena: '*****',
        rol: 'cajero',
        turno: 'vespertino',
        activo: false
      }
    ];
  }

  crearUsuario() {
    // Validaciones
    if (!this.nombre || !this.apellido || !this.usuario || !this.contrasena || !this.rol || !this.turno) {
      alert("Por favor, complete todos los campos");
      return;
    }

    if (this.esModoEdicion && this.usuarioEditando) {
      // Modo edición
      const usuarioActualizado: Usuario = {
        ...this.usuarioEditando,
        nombre: this.nombre,
        apellido: this.apellido,
        usuario: this.usuario,
        contrasena: this.contrasena,
        rol: this.rol,
        turno: this.turno
      };

      const index = this.usuarios.findIndex(u => u.id === this.usuarioEditando!.id);
      if (index !== -1) {
        this.usuarios[index] = usuarioActualizado;
      }

      alert("Usuario actualizado exitosamente");
      this.limpiarFormulario();
    } else {
      // Modo creación
      const nuevoUsuario: Usuario = {
        id: Date.now(),
        nombre: this.nombre,
        apellido: this.apellido,
        usuario: this.usuario,
        contrasena: this.contrasena,
        rol: this.rol,
        turno: this.turno,
        activo: true
      };

      this.usuarios.push(nuevoUsuario);
      alert("Usuario creado exitosamente");
      this.limpiarFormulario();
    }
  }

  editarUsuario(usuario: Usuario) {
    this.usuarioEditando = usuario;
    this.nombre = usuario.nombre;
    this.apellido = usuario.apellido;
    this.usuario = usuario.usuario;
    this.contrasena = usuario.contrasena;
    this.rol = usuario.rol;
    this.turno = usuario.turno;
    this.esModoEdicion = true;

    // Scroll al formulario
    setTimeout(() => {
      const formElement = document.querySelector('.Subir_p');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  toggleEstado(usuario: Usuario) {
    usuario.activo = !usuario.activo;
    const accion = usuario.activo ? 'activado' : 'desactivado';
    alert(`Usuario ${accion} exitosamente`);
  }

  eliminarUsuario(usuario: Usuario) {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
      alert("Usuario eliminado exitosamente");
    }
  }

  cancelarEdicion() {
    if (confirm('¿Cancelar edición? Los cambios no guardados se perderán.')) {
      this.limpiarFormulario();
    }
  }

  getRolText(rol: string): string {
    const roles = {
      'administrador': '👑 Administrador',
      'cajero': '💳 Cajero'
    };
    return roles[rol as keyof typeof roles] || rol;
  }

  getTurnoText(turno: string): string {
    const turnos = {
      'matutino': '🌅 Matutino',
      'vespertino': '🌇 Vespertino', 
      'completo': '🌞 Completo'
    };
    return turnos[turno as keyof typeof turnos] || turno;
  }

  private limpiarFormulario() {
    this.nombre = '';
    this.apellido = '';
    this.usuario = '';
    this.contrasena = '';
    this.rol = '';
    this.turno = '';
    this.usuarioEditando = null;
    this.esModoEdicion = false;
  }
}