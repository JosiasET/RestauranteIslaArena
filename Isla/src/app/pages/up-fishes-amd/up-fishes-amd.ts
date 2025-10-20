import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FishesService } from '../../core/service/FishesService';
import { Fish } from '../../core/interface/Fish';
import { Subscription } from 'rxjs';

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

  nombre = '';
  descripcion = '';
  precio: number = 0;
  imageBase64: string = '';

  private subscription: Subscription = new Subscription();

  constructor(
    private fishesService: FishesService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('🔄 Inicializando componente UpFishesAmd...');
    
    // Suscribirse al loading state
    this.subscription.add(
      this.fishesService.loading$.subscribe(loading => {
        this.isLoading = loading;
        this.forceUpdate();
      })
    );

    // Suscribirse a las especialidades - OPTIMIZADO
    this.subscription.add(
      this.fishesService.saucer$.subscribe((especialidades: Fish[]) => {
        console.log('🔄 Lista de especialidades actualizada:', especialidades.length);
        // Usar spread operator para forzar nuevo array y trigger de detección de cambios
        this.todasLasEspecialidades = [...especialidades];
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

  setSection(section: string) {
    this.activeSection = section;
    this.forceUpdate();
  }

  OnfileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imageBase64 = reader.result as string;
        this.forceUpdate();
      };
      reader.readAsDataURL(file);
    }
  }

  eliminarEspecialidad(especialidad: Fish) {
    if (!especialidad.id) {
      console.error('❌ No se puede eliminar: Especialidad sin ID', especialidad);
      alert('Error: La especialidad no tiene un ID válido');
      return;
    }

    if (confirm(`¿Estás seguro de que deseas eliminar "${especialidad.nombre}"?`)) {
      console.log('🗑️ Intentando eliminar especialidad ID:', especialidad.id);
      
      // ACTUALIZACIÓN INMEDIATA: Eliminar del array local primero
      this.todasLasEspecialidades = this.todasLasEspecialidades.filter(e => e.id !== especialidad.id);
      this.forceUpdate();
      
      this.fishesService.eliminarEspecialidad(especialidad.id).subscribe({
        next: () => {
          console.log('✅ Eliminación completada');
        },
        error: (err) => {
          console.error('❌ Error eliminando especialidad:', err);
          alert('Error al eliminar la especialidad');
          // Si hay error, recargar desde el servidor
          this.fishesService.cargarEspecialidades().subscribe();
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
    this.precio = especialidad.precio;
    this.imageBase64 = especialidad.imagen;
    this.esModoEdicion = true;
    
    this.forceUpdate();
    
    // Scroll al formulario
    setTimeout(() => {
      document.querySelector('.form-bar')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  }

  subirEspecialidad() {
    if (!this.nombre || !this.descripcion || !this.precio || !this.imageBase64) {
      alert('Por favor, rellene todos los espacios');
      return;
    }

    if (this.precio <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }

    this.isSubmitting = true;
    this.forceUpdate();

    if (this.esModoEdicion && this.especialidadEditando) {
      // MODO EDICIÓN
      if (!this.especialidadEditando.id) {
        alert('Error: No se puede editar una especialidad sin ID');
        this.isSubmitting = false;
        this.forceUpdate();
        return;
      }

      const especialidadActualizada: Fish = {
        id: this.especialidadEditando.id,
        nombre: this.nombre,
        descripcion: this.descripcion,
        precio: this.precio,
        imagen: this.imageBase64
      };

      console.log('🔄 Actualizando especialidad:', especialidadActualizada);

      // ACTUALIZACIÓN INMEDIATA: Actualizar en el array local primero
      const index = this.todasLasEspecialidades.findIndex(e => e.id === this.especialidadEditando!.id);
      if (index !== -1) {
        this.todasLasEspecialidades[index] = { ...especialidadActualizada };
        this.forceUpdate();
      }

      this.fishesService.actualizarEspecialidad(especialidadActualizada).subscribe({
        next: (respuesta) => {
          console.log('✅ Especialidad actualizada exitosamente');
          this.esModoEdicion = false;
          this.isSubmitting = false;
          alert('Especialidad actualizada exitosamente');
          this.limpiarFormulario();
        },
        error: (err) => {
          console.error('❌ Error actualizando:', err);
          this.isSubmitting = false;
          alert('Error al actualizar la especialidad');
          // Si hay error, recargar desde el servidor
          this.fishesService.cargarEspecialidades().subscribe();
        }
      });
    } else {
      // MODO CREACIÓN
      const nuevaEspecialidad: Fish = {
        id: 0, // ID temporal que será reemplazado por el backend
        nombre: this.nombre,
        descripcion: this.descripcion,
        precio: this.precio,
        imagen: this.imageBase64
      };

      console.log('🔄 Subiendo nueva especialidad');

      // ACTUALIZACIÓN INMEDIATA: Agregar al array local primero (con ID temporal)
      this.todasLasEspecialidades = [nuevaEspecialidad, ...this.todasLasEspecialidades];
      this.forceUpdate();

      this.fishesService.agregarEspecialidad(nuevaEspecialidad).subscribe({
        next: (respuesta) => {
          console.log('✅ Especialidad agregada exitosamente');
          this.isSubmitting = false;
          alert('Especialidad subida exitosamente');
          this.limpiarFormulario();
          // El servicio ya actualiza automáticamente el BehaviorSubject
        },
        error: (err) => {
          console.error('❌ Error subiendo:', err);
          this.isSubmitting = false;
          alert('Error al subir la especialidad');
          // Si hay error, recargar desde el servidor
          this.fishesService.cargarEspecialidades().subscribe();
        }
      });
    }
  }

  cancelarEdicion() {
    if (confirm('¿Cancelar edición? Los cambios no guardados se perderán.')) {
      this.limpiarFormulario();
      this.forceUpdate();
    }
  }

  private limpiarFormulario() {
    this.nombre = '';
    this.descripcion = '';
    this.precio = 0;
    this.imageBase64 = '';
    this.especialidadEditando = null;
    this.esModoEdicion = false;
    this.isSubmitting = false;

    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  getTotalEspecialidades(): number {
    return this.todasLasEspecialidades.length;
  }
}