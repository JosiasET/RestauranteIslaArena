import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { foodInterface } from '../../core/interface/foodInterface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodService } from '../../core/service/foodService';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-up-food-amd',
  imports: [CommonModule, FormsModule],
  templateUrl: './up-food-amd.html',
  styleUrl: './up-food-amd.css' 
})
export class UpFoodAmd implements OnInit, OnDestroy {
  activeSection: String = 'upfood';
  todosLosPlatillos: foodInterface[] = [];
  platilloEditando: foodInterface | null = null;
  esModoEdicion: boolean = false;
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  isOffline: boolean = false; // ✅ NUEVA PROPIEDAD

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
    private foodService: FoodService,
    private cdRef: ChangeDetectorRef
  ){}

  ngOnInit() {
    console.log('🔄 Inicializando componente UpFoodAmd...');
    
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
      this.foodService.loading$.subscribe(loading => {
        this.isLoading = loading;
        this.cdRef.detectChanges();
      })
    );

    this.subscription.add(
      this.foodService.saucer$.subscribe((platillos: foodInterface[]) => {
        console.log('🔄 Lista de platillos actualizada:', platillos.length);
        this.todosLosPlatillos = platillos;
        this.isLoading = false;
        this.cdRef.detectChanges();
      })
    );

    if (this.todosLosPlatillos.length === 0) {
      this.cargarPlatillosInicial();
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  cargarPlatillosInicial() {
    console.log('🔄 Cargando platillos inicialmente...');
    this.foodService.cargarPlatillos().subscribe({
      next: (platillos) => {
        console.log('✅ Platillos cargados exitosamente:', platillos.length);
      },
      error: (err) => {
        console.error('❌ Error cargando platillos:', err);
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
  eliminarPlatillo(platillo: foodInterface) {
    if (!platillo.id) {
      console.error('❌ No se puede eliminar: Platillo sin ID', platillo);
      alert('Error: El platillo no tiene un ID válido');
      return;
    }

    if (confirm(`¿Estás seguro de que deseas eliminar "${platillo.nombre}"?`)) {
      // ✅ CORRECCIÓN - Manejar correctamente string y number
      let idParaEliminar: number;
      
      if (typeof platillo.id === 'string') {
        idParaEliminar = parseInt(platillo.id);
        if (isNaN(idParaEliminar)) {
          idParaEliminar = 0;
        }
      } else {
        idParaEliminar = platillo.id;
      }

      console.log('🗑️ Intentando eliminar platillo ID:', idParaEliminar);
      
      this.foodService.eliminarPlatillo(idParaEliminar).subscribe({
        next: () => {
          console.log('✅ Eliminación completada');
        },
        error: (err) => {
          console.error('❌ Error eliminando platillo:', err);
          alert('Error al eliminar el platillo');
        }
      });
    }
  }

  editarPlatillo(platillo: foodInterface) {
    if (!platillo.id) {
      console.error('❌ No se puede editar: Platillo sin ID', platillo);
      alert('Error: El platillo no tiene un ID válido');
      return;
    }

    console.log('✏️ Editando platillo ID:', platillo.id);
    this.platilloEditando = platillo;
    this.nombre = platillo.nombre;
    this.descripcion = platillo.descripcion;
    this.descripcion_real = platillo.descripcion_real || '';
    this.precio = platillo.precio;
    this.imageBase64 = platillo.imagen;
    this.tiene_tamanos = platillo.tiene_tamanos || false;
    this.tamanos = platillo.tamanos || [];
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

  subirsaucer() {
    if (!this.nombre || !this.descripcion || !this.precio || !this.imageBase64) {
      alert("Por favor, rellene todos los espacios");
      return;
    }

    if (this.precio <= 0) {
      alert("El precio debe ser mayor a 0");
      return;
    }

    if (this.tiene_tamanos && this.tamanos.length === 0) {
      alert("Debe agregar al menos un tamaño si ha habilitado esta opción");
      return;
    }

    this.isSubmitting = true;
    this.cdRef.detectChanges();

    const platilloData: foodInterface = {
      id: this.esModoEdicion && this.platilloEditando ? this.platilloEditando.id : 0,
      nombre: this.nombre,
      descripcion: this.descripcion,
      descripcion_real: this.descripcion_real,
      precio: Number(this.precio),
      imagen: this.imageBase64,
      tiene_tamanos: this.tiene_tamanos,
      tamanos: this.tiene_tamanos ? this.tamanos : undefined
    };

    if (this.esModoEdicion && this.platilloEditando) {
      // MODO EDICIÓN
      if (!this.platilloEditando.id) {
        alert('Error: No se puede editar un platillo sin ID');
        this.isSubmitting = false;
        this.cdRef.detectChanges();
        return;
      }

      console.log('🔄 Actualizando platillo:', platilloData);

      this.foodService.actualizarPlatillo(platilloData).subscribe({
        next: (respuesta) => {
          console.log('✅ Platillo actualizado exitosamente');
          this.esModoEdicion = false;
          this.isSubmitting = false;
          
          // ✅ MENSAJE MEJORADO
          if (this.isOffline) {
            alert("📱 Platillo actualizado localmente - Se sincronizará cuando haya internet");
          } else {
            alert("✅ Platillo actualizado exitosamente en el servidor");
          }
          
          this.limpiarFormulario();
        },
        error: (err) => {
          console.error('❌ Error actualizando:', err);
          this.isSubmitting = false;
          alert("Error al actualizar el platillo: " + err.message);
          this.cdRef.detectChanges();
        }
      });
    } else {
      // MODO CREACIÓN
      console.log('🔄 Subiendo nuevo platillo');

      this.foodService.agregarPlatillo(platilloData).subscribe({
        next: (respuesta) => {
          console.log('✅ Platillo agregado exitosamente');
          this.isSubmitting = false;
          
          // ✅ MENSAJE MEJORADO
          if (this.isOffline) {
            alert("📱 Platillo guardado localmente - Se subirá automáticamente cuando recuperes internet");
          } else {
            alert("✅ Platillo subido exitosamente al servidor");
          }
          
          this.limpiarFormulario();
        },
        error: (err) => {
          console.error('❌ Error subiendo:', err);
          this.isSubmitting = false;
          alert("Error al subir el platillo: " + err.message);
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
    this.platilloEditando = null;
    this.esModoEdicion = false;
    this.isSubmitting = false;
    
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    this.cdRef.detectChanges();
  }

  getTotalPlatillos(): number {
    return this.todosLosPlatillos.length;
  }

  forzarRecarga() {
    console.log('🔄 Forzando recarga manual...');
    this.cargarPlatillosInicial();
  }

  // ✅ MÉTODO PARA MENSAJE OFFLINE
  getMensajeEstado(): string {
    return this.isOffline ? '📱 Modo offline - Los cambios se guardarán localmente' : '🌐 Conectado';
  }

  // ✅ MÉTODO PARA VER SI UN PLATILLO ES OFFLINE
  
}