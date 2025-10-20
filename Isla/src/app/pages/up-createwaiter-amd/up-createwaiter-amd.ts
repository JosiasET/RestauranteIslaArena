import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MeseroService } from '../../core/service/WaiterService';
import { MeseroInterface } from '../../core/interface/waiter';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-up-createwaiter-amd',
  imports: [CommonModule, FormsModule],
  templateUrl: './up-createwaiter-amd.html',
  styleUrls: ['./up-createwaiter-amd.css']
})
export class UpCreatewaiterAmd implements OnInit, OnDestroy {
  meseros: MeseroInterface[] = [];
  meseroEditando: MeseroInterface | null = null;
  esModoEdicion: boolean = false;
  isLoading: boolean = true;
  isSubmitting: boolean = false;

  // Campos del formulario
  nombre: string = '';
  apellido: string = '';
  usuario: string = '';
  contrasena: string = '';
  rol: string = '';
  turno: string = '';

  // Variable para controlar la visibilidad de la contraseña
  showPassword: boolean = false;

  private subscription: Subscription = new Subscription();

  constructor(
    private meseroService: MeseroService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('🔄 Inicializando componente UpCreatewaiterAmd...');
    
    // Suscribirse al loading state
    this.subscription.add(
      this.meseroService.loading$.subscribe(loading => {
        this.isLoading = loading;
        this.forceUpdate();
      })
    );

    // Suscribirse a los meseros - ESTO HACE EL REFRESH AUTOMÁTICO
    this.subscription.add(
      this.meseroService.meseros$.subscribe((meseros: MeseroInterface[]) => {
        console.log('🔄 Lista de meseros actualizada:', meseros.length);
        this.meseros = [...meseros];
        this.forceUpdate();
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // Método optimizado para forzar actualización
  private forceUpdate() {
    setTimeout(() => {
      this.cdRef.detectChanges();
    }, 0);
  }

  crearMesero() {
    if (!this.nombre || !this.apellido || !this.usuario || !this.rol || !this.turno) {
      alert("Por favor, complete todos los campos requeridos.");
      return;
    }
    if (!this.esModoEdicion && !this.contrasena) {
      alert("La contraseña es obligatoria al crear un nuevo mesero.");
      return;
    }

    this.isSubmitting = true;
    this.forceUpdate();

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
      // ACTUALIZACIÓN INMEDIATA: Actualizar en el array local primero
      const index = this.meseros.findIndex(m => m.id === this.meseroEditando!.id);
      if (index !== -1) {
        this.meseros[index] = { ...meseroData };
        this.forceUpdate();
      }

      this.meseroService.actualizarMesero(meseroData).subscribe({
        next: (respuesta) => {
          console.log('✅ Mesero actualizado exitosamente');
          this.isSubmitting = false;
          alert("Mesero actualizado exitosamente");
          this.limpiarFormulario();
        },
        error: (err) => {
          console.error('❌ Error actualizando mesero:', err);
          this.isSubmitting = false;
          alert("Error al actualizar el mesero");
          // Si hay error, recargar desde el servidor
          this.meseroService.cargarMeseros().subscribe();
        }
      });
    } else {
      // ACTUALIZACIÓN INMEDIATA: Agregar al array local primero (con ID temporal)
      this.meseros = [meseroData, ...this.meseros];
      this.forceUpdate();

      this.meseroService.crearMesero(meseroData).subscribe({
        next: (respuesta) => {
          console.log('✅ Mesero creado exitosamente');
          this.isSubmitting = false;
          alert("Mesero creado exitosamente");
          this.limpiarFormulario();
        },
        error: (err) => {
          console.error('❌ Error creando mesero:', err);
          this.isSubmitting = false;
          alert("Error al crear el mesero");
          // Si hay error, recargar desde el servidor
          this.meseroService.cargarMeseros().subscribe();
        }
      });
    }
  }

  editarMesero(mesero: MeseroInterface) {
    if (!mesero.id) {
      console.error('❌ No se puede editar: Mesero sin ID', mesero);
      alert('Error: El mesero no tiene un ID válido');
      return;
    }

    console.log('✏️ Editando mesero ID:', mesero.id);
    this.meseroEditando = mesero;
    this.esModoEdicion = true;
    
    // Asignación segura de valores para evitar errores con datos viejos
    this.nombre = mesero.nombre || '';
    this.apellido = mesero.apellido || '';
    this.usuario = mesero.usuario || '';
    this.contrasena = ''; // La contraseña no se carga al editar por seguridad
    this.rol = mesero.rol || '';
    this.turno = mesero.turno || '';

    this.forceUpdate();
    window.scrollTo(0, 0);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.forceUpdate();
  }

  toggleEstado(mesero: MeseroInterface) {
    if (!mesero.id) {
      console.error('❌ No se puede cambiar estado: Mesero sin ID', mesero);
      alert('Error: El mesero no tiene un ID válido');
      return;
    }

    // ACTUALIZACIÓN INMEDIATA: Cambiar estado en el array local primero
    const index = this.meseros.findIndex(m => m.id === mesero.id);
    if (index !== -1) {
      this.meseros[index] = { ...mesero, activo: !mesero.activo };
      this.forceUpdate();
    }

    this.meseroService.toggleEstado(mesero).subscribe({
      next: (respuesta) => {
        console.log('✅ Estado del mesero actualizado');
      },
      error: (err) => {
        console.error('❌ Error cambiando estado:', err);
        alert('Error al cambiar el estado del mesero');
        // Si hay error, recargar desde el servidor
        this.meseroService.cargarMeseros().subscribe();
      }
    });
  }

  eliminarMesero(mesero: MeseroInterface) {
    if (!mesero.id) {
      console.error('❌ No se puede eliminar: Mesero sin ID', mesero);
      alert('Error: El mesero no tiene un ID válido');
      return;
    }

    if (confirm("¿Estás seguro de que deseas eliminar a este mesero?")) {
      console.log('🗑️ Intentando eliminar mesero ID:', mesero.id);
      
      // ACTUALIZACIÓN INMEDIATA: Eliminar del array local primero
      this.meseros = this.meseros.filter(m => m.id !== mesero.id);
      this.forceUpdate();

      this.meseroService.eliminarMesero(mesero.id).subscribe({
        next: () => {
          console.log('✅ Eliminación completada');
        },
        error: (err) => {
          console.error('❌ Error eliminando mesero:', err);
          alert('Error al eliminar el mesero');
          // Si hay error, recargar desde el servidor
          this.meseroService.cargarMeseros().subscribe();
        }
      });
    }
  }

  cancelarEdicion() {
    this.limpiarFormulario();
    this.forceUpdate();
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
    this.isSubmitting = false;
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