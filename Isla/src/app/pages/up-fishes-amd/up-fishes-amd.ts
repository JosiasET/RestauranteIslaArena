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

  // Campos del formulario
  nombre = '';
  descripcion = '';
  descripcion_real = '';
  precio: number = 0;
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
        this.cdRef.detectChanges();
      })
    );

    this.cargarEspecialidades();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  cargarEspecialidades() {
    console.log('🔄 Solicitando carga de especialidades...');
    this.fishesService.cargarEspecialidades().subscribe({
      next: (especialidades) => {
        console.log('✅ Especialidades cargadas exitosamente:', especialidades.length);
        this.cdRef.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error cargando especialidades:', err);
        this.cdRef.detectChanges();
      }
    });
  }

  // Método para eliminar la imagen seleccionada
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

  // Métodos para gestionar tamaños
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

  eliminarEspecialidad(especialidad: Fish) {
    if (!especialidad.id) {
      console.error('❌ No se puede eliminar: Especialidad sin ID', especialidad);
      alert('Error: La especialidad no tiene un ID válido');
      return;
    }

    if (confirm(`¿Estás seguro de que deseas eliminar "${especialidad.nombre}"?`)) {
      console.log('🗑️ Intentando eliminar especialidad ID:', especialidad.id);
      
      this.fishesService.eliminarEspecialidad(especialidad.id).subscribe({
        next: () => {
          console.log('✅ Eliminación completada');
          this.cdRef.detectChanges();
        },
        error: (err) => {
          console.error('❌ Error eliminando especialidad:', err);
          alert('Error al eliminar la especialidad');
          this.cdRef.detectChanges();
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

    // Validar tamaños si están habilitados
    if (this.tiene_tamanos && this.tamanos.length === 0) {
      alert("Debe agregar al menos un tamaño si ha habilitado esta opción");
      return;
    }

    this.isSubmitting = true;
    this.cdRef.detectChanges();

    // Crear objeto con ID temporal para nuevas especialidades
    const especialidadData: Fish = {
      id: this.esModoEdicion && this.especialidadEditando ? this.especialidadEditando.id : 0, // ID temporal para nuevas
      nombre: this.nombre,
      descripcion: this.descripcion,
      descripcion_real: this.descripcion_real,
      precio: Number(this.precio),
      imagen: this.imageBase64,
      tiene_tamanos: this.tiene_tamanos,
      tamanos: this.tiene_tamanos ? this.tamanos : undefined,
      tipos: [] // Agregar tipos vacío si es requerido
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
          alert("Especialidad actualizada exitosamente");
          this.limpiarFormulario();
          this.cdRef.detectChanges();
        },
        error: (err) => {
          console.error('❌ Error actualizando:', err);
          this.isSubmitting = false;
          alert("Error al actualizar la especialidad");
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
          alert("Especialidad subida exitosamente");
          this.limpiarFormulario();
          this.cdRef.detectChanges();
        },
        error: (err) => {
          console.error('❌ Error subiendo:', err);
          this.isSubmitting = false;
          alert("Error al subir la especialidad");
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
    this.cargarEspecialidades();
  }
}