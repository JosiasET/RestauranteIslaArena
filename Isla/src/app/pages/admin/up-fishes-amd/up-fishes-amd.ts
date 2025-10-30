import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Subscription } from 'rxjs';
import { FishesService } from '../../../core/service/FishesService';
import { Fish } from '../../../core/interface/Fish';

@Component({
  selector: 'app-up-fishes-amd',
  imports: [CommonModule, FormsModule],
  templateUrl: './up-fishes-amd.html',
  styleUrls: ['./up-fishes-amd.css']
})
export class UpFishesAmd implements OnInit, OnDestroy {
  activeSection: string = 'upfishes';
  todasLasEspecialidades: Fish[] = [];
  especialidadEditando: Fish | null = null;
  esModoEdicion: boolean = false;
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  isOffline: boolean = false; // ✅ NUEVA PROPIEDAD

  // Campos del formulario
  nombre = '';
  descripcion = '';
  descripcion_real = '';
  precio: number = 0;
  stock: number = 0;
  imageBase64: string = '';
  tiene_tamanos: boolean = false;

  // Gestión de tamaños
  tamanos: any[] = [];
  nuevoTamano: any = { nombre: '', precio: 0 };

  private subscription: Subscription = new Subscription();

  constructor(
    private fishesService: FishesService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('🔄 Inicializando componente UpFishesAmd...');
    
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

    this.subscription.add(
      this.fishesService.loading$.subscribe(loading => {
        this.isLoading = loading;
        this.cdRef.detectChanges();
      })
    );

    this.subscription.add(
      this.fishesService.saucer$.subscribe((especialidades: Fish[]) => {
        console.log('🔄 Lista de especialidades actualizada:', especialidades.length);
        this.todasLasEspecialidades = especialidades;
        this.isLoading = false;
        this.cdRef.detectChanges();
      })
    );

    if (this.todasLasEspecialidades.length === 0) {
      this.cargarEspecialidadesInicial();
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  cargarEspecialidadesInicial() {
    console.log('🔄 Cargando especialidades inicialmente...');
    this.fishesService.cargarEspecialidades().subscribe({
      next: (especialidades) => {
        console.log('✅ Especialidades cargadas exitosamente:', especialidades.length);
      },
      error: (err) => {
        console.error('❌ Error cargando especialidades:', err);
        this.isLoading = false;
        this.cdRef.detectChanges();
      }
    });
  }

  eliminarImagen() {
    if (confirm('¿Estás seguro de que deseas eliminar la imagen seleccionada?')) {
      this.imageBase64 = '';
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      this.cdRef.detectChanges();
    }
  }

  agregarTamano() {
    if (this.nuevoTamano.nombre && this.nuevoTamano.precio > 0) {
      this.tamanos.push({...this.nuevoTamano});
      console.log('✅ Tamaño agregado:', this.tamanos[this.tamanos.length - 1]);
      this.nuevoTamano = { nombre: '', precio: 0 };
      this.cdRef.detectChanges();
    } else {
      alert('Por favor, complete el nombre y precio del tamaño');
    }
  }

  eliminarTamano(index: number) {
    this.tamanos.splice(index, 1);
    this.cdRef.detectChanges();
  }

  setSection(section: string) {
    this.activeSection = section;
    this.cdRef.detectChanges();
  }

  OnfileSelected(event: any){
    const file = event.target.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = () =>{
        this.imageBase64 = reader.result as string;
        console.log('📸 Imagen seleccionada');
        this.cdRef.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  // ✅ CORREGIDO - Manejar IDs string y number
  eliminarEspecialidad(especialidad: Fish) {
    if (!especialidad.id) {
      console.error('❌ No se puede eliminar: Especialidad sin ID', especialidad);
      alert('Error: La especialidad no tiene un ID válido');
      return;
    }

    if (confirm(`¿Estás seguro de que deseas eliminar "${especialidad.nombre}"?`)) {
      // ✅ CORRECCIÓN - Manejar correctamente string y number
      let idParaEliminar: number;
      
      if (typeof especialidad.id === 'string') {
        idParaEliminar = parseInt(especialidad.id);
        if (isNaN(idParaEliminar)) {
          idParaEliminar = 0;
        }
      } else {
        idParaEliminar = especialidad.id;
      }

      console.log('🗑️ Intentando eliminar especialidad ID:', idParaEliminar);
      
      this.fishesService.eliminarEspecialidad(idParaEliminar).subscribe({
        next: () => {
          console.log('✅ Eliminación completada');
        },
        error: (err) => {
          console.error('❌ Error eliminando especialidad:', err);
          alert('Error al eliminar la especialidad');
        }
      });
    }
  }

  editarEspecialidad(especialidad: Fish) {
    if (!especialidad.id) {
      console.error('❌ No se puede editar: Especialidad sin ID', especialidad);
      alert('Error: La especialidad no tiene un ID válido');
      return;
    }

    console.log('✏️ Editando especialidad ID:', especialidad.id);
    this.especialidadEditando = especialidad;
    this.nombre = especialidad.nombre;
    this.descripcion = especialidad.descripcion;
    this.descripcion_real = especialidad.descripcion_real || '';
    this.precio = especialidad.precio;
    this.stock = especialidad.cantidad || 0;
    this.imageBase64 = especialidad.imagen;
    this.tiene_tamanos = especialidad.tiene_tamanos || false;
    this.tamanos = especialidad.tamanos || [];
    this.esModoEdicion = true;
    
    console.log('📋 Tamaños cargados para edición:', this.tamanos);
    
    this.cdRef.detectChanges();
    
    setTimeout(() => {
      document.querySelector('.form-bar')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  }

  subirEspecialidad() {
    // Validaciones
    if (!this.nombre || !this.descripcion || !this.precio || !this.imageBase64) {
      alert("Por favor, rellene todos los espacios");
      return;
    }

    if (this.precio <= 0) {
      alert("El precio debe ser mayor a 0");
      return;
    }

    // Validar stock
    if (this.stock < 0) {
      alert("El stock no puede ser negativo");
      return;
    }

    // Validar tamaños si están habilitados
    if (this.tiene_tamanos && this.tamanos.length === 0) {
      alert("Debe agregar al menos un tamaño si ha habilitado esta opción");
      return;
    }

    this.isSubmitting = true;
    this.cdRef.detectChanges();

    // Crear objeto con ID temporal para nuevas especialidades
    const especialidadData: Fish = {
      id: this.esModoEdicion && this.especialidadEditando ? this.especialidadEditando.id : 0,
      nombre: this.nombre,
      descripcion: this.descripcion,
      descripcion_real: this.descripcion_real,
      precio: Number(this.precio),
      cantidad: this.stock,
      imagen: this.imageBase64,
      tiene_tamanos: this.tiene_tamanos,
      tamanos: this.tiene_tamanos ? this.tamanos : undefined,
      tipos: []
    };

    if (this.esModoEdicion && this.especialidadEditando) {
      // MODO EDICIÓN
      if (!this.especialidadEditando.id) {
        alert('Error: No se puede editar una especialidad sin ID');
        this.isSubmitting = false;
        this.cdRef.detectChanges();
        return;
      }

      console.log('🔄 Actualizando especialidad:', especialidadData);

      this.fishesService.actualizarEspecialidad(especialidadData).subscribe({
        next: (respuesta) => {
          console.log('✅ Especialidad actualizada exitosamente');
          this.esModoEdicion = false;
          this.isSubmitting = false;
          
          // ✅ MENSAJE MEJORADO
          if (this.isOffline) {
            alert("📱 Especialidad actualizada localmente - Se sincronizará cuando haya internet");
          } else {
            alert("✅ Especialidad actualizada exitosamente en el servidor");
          }
          
          this.limpiarFormulario();
        },
        error: (err) => {
          console.error('❌ Error actualizando:', err);
          this.isSubmitting = false;
          alert("Error al actualizar la especialidad: " + err.message);
          this.cdRef.detectChanges();
        }
      });
    } else {
      // MODO CREACIÓN
      console.log('🔄 Subiendo nueva especialidad');

      this.fishesService.agregarEspecialidad(especialidadData).subscribe({
        next: (respuesta) => {
          console.log('✅ Especialidad agregada exitosamente');
          this.isSubmitting = false;
          
          // ✅ MENSAJE MEJORADO
          if (this.isOffline) {
            alert("📱 Especialidad guardada localmente - Se subirá automáticamente cuando recuperes internet");
          } else {
            alert("✅ Especialidad subida exitosamente al servidor");
          }
          
          this.limpiarFormulario();
        },
        error: (err) => {
          console.error('❌ Error subiendo:', err);
          this.isSubmitting = false;
          alert("Error al subir la especialidad: " + err.message);
          this.cdRef.detectChanges();
        }
      });
    }
  }

  cancelarEdicion() {
    if (confirm('¿Cancelar edición? Los cambios no guardados se perderán.')) {
      this.limpiarFormulario();
      this.cdRef.detectChanges();
    }
  }

  limpiarFormulario() {
    this.nombre = '';
    this.descripcion = '';
    this.descripcion_real = '';
    this.precio = 0;
    this.stock = 0;
    this.imageBase64 = '';
    this.tiene_tamanos = false;
    this.tamanos = [];
    this.nuevoTamano = { nombre: '', precio: 0 };
    this.especialidadEditando = null;
    this.esModoEdicion = false;
    this.isSubmitting = false;
    
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    this.cdRef.detectChanges();
  }

  getTotalEspecialidades(): number {
    return this.todasLasEspecialidades.length;
  }

  forzarRecarga() {
    console.log('🔄 Forzando recarga manual...');
    this.cargarEspecialidadesInicial();
  }

  // ✅ MÉTODO PARA MENSAJE OFFLINE
  getMensajeEstado(): string {
    return this.isOffline ? '📱 Modo offline - Los cambios se guardarán localmente' : '🌐 Conectado';
  }

  // ✅ MÉTODO PARA VER SI UNA ESPECIALIDAD ES OFFLINE
}