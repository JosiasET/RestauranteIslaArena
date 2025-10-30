import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Subscription } from 'rxjs';
import { MeseroService } from '../../../core/service/WaiterService';
import { MeseroInterface } from '../../../core/interface/waiter';

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
  isOffline: boolean = false; // ✅ NUEVA PROPIEDAD

  // Campos del formulario
  nombre: string = '';
  apellido: string = '';
  usuario: string = '';
  contrasena: string = '';
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
    
    // ✅ VERIFICAR ESTADO OFFLINE/ONLINE
    this.isOffline = !navigator.onLine;
    window.addEventListener('online', () => {
      this.isOffline = false;
      this.forceUpdate();
    });
    window.addEventListener('offline', () => {
      this.isOffline = true;
      this.forceUpdate();
    });

    // Suscribirse al loading state
    this.subscription.add(
      this.meseroService.loading$.subscribe(loading => {
        this.isLoading = loading;
        this.forceUpdate();
      })
    );

    // Suscribirse a los meseros
    this.subscription.add(
      this.meseroService.meseros$.subscribe((meseros: MeseroInterface[]) => {
        console.log('🔄 Lista de meseros actualizada:', meseros.length);
        this.meseros = [...meseros];
        this.forceUpdate();
      })
    );

    // Cargar datos iniciales
    this.meseroService.cargarMeseros().subscribe();
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
    if (!this.nombre || !this.apellido || !this.usuario || !this.turno) {
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
      rol: 'mesero',
      turno: this.turno,
      activo: this.meseroEditando ? this.meseroEditando.activo : true
    };

    if (this.esModoEdicion && this.meseroEditando) {
      // ✅ MODO EDICIÓN CON MENSAJE OFFLINE
      this.meseroService.actualizarMesero(meseroData).subscribe({
        next: (respuesta) => {
          console.log('✅ Mesero actualizado exitosamente');
          this.isSubmitting = false;
          
          // ✅ MENSAJE MEJORADO
          if (this.isOffline) {
            alert("📱 Mesero actualizado localmente - Se sincronizará cuando haya internet");
          } else {
            alert("✅ Mesero actualizado exitosamente");
          }
          
          this.limpiarFormulario();
        },
        error: (err) => {
          console.error('❌ Error actualizando mesero:', err);
          this.isSubmitting = false;
          alert("Error al actualizar el mesero");
        }
      });
    } else {
      // ✅ MODO CREACIÓN CON MENSAJE OFFLINE
      this.meseroService.crearMesero(meseroData).subscribe({
        next: (respuesta) => {
          console.log('✅ Mesero creado exitosamente');
          this.isSubmitting = false;
          
          // ✅ MENSAJE MEJORADO
          if (this.isOffline) {
            alert("📱 Mesero guardado localmente - Se sincronizará automáticamente cuando recuperes internet");
          } else {
            alert("✅ Mesero creado exitosamente");
          }
          
          this.limpiarFormulario();
        },
        error: (err) => {
          console.error('❌ Error creando mesero:', err);
          this.isSubmitting = false;
          alert("Error al crear el mesero");
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
    
    // Asignación segura de valores
    this.nombre = mesero.nombre || '';
    this.apellido = mesero.apellido || '';
    this.usuario = mesero.usuario || '';
    this.contrasena = ''; // La contraseña no se carga al editar por seguridad
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

    // ✅ CORREGIDO - Manejar IDs string y number
    let idParaOperar: number;
    
    if (typeof mesero.id === 'string') {
      idParaOperar = parseInt(mesero.id);
      if (isNaN(idParaOperar)) {
        idParaOperar = 0;
      }
    } else {
      idParaOperar = mesero.id;
    }

    const meseroConIdNumerico: MeseroInterface = {
      ...mesero,
      id: idParaOperar
    };

    this.meseroService.toggleEstado(meseroConIdNumerico).subscribe({
      next: (respuesta) => {
        console.log('✅ Estado del mesero actualizado');
        
        // ✅ MENSAJE MEJORADO
        if (this.isOffline) {
          alert(`📱 Estado cambiado localmente - Se sincronizará cuando haya internet`);
        }
      },
      error: (err) => {
        console.error('❌ Error cambiando estado:', err);
        alert('Error al cambiar el estado del mesero');
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
      
      // ✅ CORREGIDO - Manejar IDs string y number
      let idParaEliminar: number;
      
      if (typeof mesero.id === 'string') {
        idParaEliminar = parseInt(mesero.id);
        if (isNaN(idParaEliminar)) {
          idParaEliminar = 0;
        }
      } else {
        idParaEliminar = mesero.id;
      }

      this.meseroService.eliminarMesero(idParaEliminar).subscribe({
        next: () => {
          console.log('✅ Eliminación completada');
          
          // ✅ MENSAJE MEJORADO
          if (this.isOffline) {
            alert("📱 Mesero marcado para eliminar - Se eliminará del servidor cuando haya internet");
          }
        },
        error: (err) => {
          console.error('❌ Error eliminando mesero:', err);
          alert('Error al eliminar el mesero');
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
    this.turno = '';
    this.meseroEditando = null;
    this.esModoEdicion = false;
    this.isSubmitting = false;
  }

  getTurnoText(turno: string): string {
    if (turno === 'matutino') return '🌅 Matutino';
    if (turno === 'vespertino') return '🌇 Vespertino';
    if (turno === 'completo') return '🌞 Completo';
    return turno;
  }

  getEstadoText(activo: boolean): string {
    return activo ? '✅ Activo' : '❌ Inactivo';
  }

  // ✅ MÉTODO PARA MOSTRAR ESTADO OFFLINE
  getEstadoConexion(): string {
    return this.isOffline ? '📱 Modo offline' : '🌐 En línea';
  }

  // ✅ MÉTODO PARA VER SI UN MESERO ES OFFLINE
  esMeseroOffline(mesero: MeseroInterface): boolean {
    return mesero.offline || false;
  }

  // ✅ MÉTODO PARA OBTENER ESTADO DE SINCRONIZACIÓN
  getEstadoSincronizacion(mesero: MeseroInterface): string {
    if (mesero.offline) {
      switch (mesero.syncStatus) {
        case 'pending': return '⏳ Pendiente';
        case 'synced': return '✅ Sincronizado';
        case 'failed': return '❌ Error';
        default: return '⏳ Pendiente';
      }
    }
    return '✅ En línea';
  }
}