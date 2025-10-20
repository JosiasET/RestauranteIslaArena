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

  nombre = '';
  descripcion = '';
  precio: number = 0;
  imageBase64: string = '';

  private subscription: Subscription = new Subscription();

  constructor(
    private foodService: FoodService,
    private cdRef: ChangeDetectorRef // Añadido ChangeDetectorRef
  ){}

  ngOnInit() {
    console.log('🔄 Inicializando componente UpFoodAmd...');
    
    // Suscribirse al loading state
    this.subscription.add(
      this.foodService.loading$.subscribe(loading => {
        this.isLoading = loading;
        console.log('📊 Estado de carga:', loading);
        this.cdRef.detectChanges(); // Forzar detección de cambios
      })
    );

    // Suscribirse a los platillos
    this.subscription.add(
      this.foodService.saucer$.subscribe((platillos: foodInterface[]) => {
        console.log('🔄 Lista de platillos actualizada:', platillos.length);
        console.log('📝 IDs en la lista:', platillos.map(p => p.id));
        this.todosLosPlatillos = platillos;
        this.cdRef.detectChanges(); // Forzar detección de cambios después de actualizar
      })
    );

    // Cargar platillos inicialmente
    this.cargarPlatillos();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  cargarPlatillos() {
    console.log('🔄 Solicitando carga de platillos...');
    this.foodService.cargarPlatillos().subscribe({
      next: (platillos) => {
        console.log('✅ Platillos cargados exitosamente:', platillos.length);
        this.cdRef.detectChanges(); // Forzar detección de cambios
      },
      error: (err) => {
        console.error('❌ Error cargando platillos:', err);
        this.cdRef.detectChanges(); // Forzar detección de cambios incluso en error
      }
    });
  }

  setSection(section: string) {
    this.activeSection = section;
    this.cdRef.detectChanges(); // Forzar detección de cambios al cambiar sección
  }

  OnfileSelected(event: any){
    const file = event.target.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = () =>{
        this.imageBase64 = reader.result as string;
        console.log('📸 Imagen seleccionada');
        this.cdRef.detectChanges(); // Forzar detección de cambios
      };
      reader.readAsDataURL(file);
    }
  }

  eliminarPlatillo(platillo: foodInterface) {
    if (!platillo.id) {
      console.error('❌ No se puede eliminar: Platillo sin ID', platillo);
      alert('Error: El platillo no tiene un ID válido');
      return;
    }

    if (confirm(`¿Estás seguro de que deseas eliminar "${platillo.nombre}"?`)) {
      console.log('🗑️ Intentando eliminar platillo ID:', platillo.id);
      
      this.foodService.eliminarPlatillo(platillo.id).subscribe({
        next: () => {
          console.log('✅ Eliminación completada');
          this.cdRef.detectChanges(); // Forzar detección de cambios después de eliminar
        },
        error: (err) => {
          console.error('❌ Error eliminando platillo:', err);
          alert('Error al eliminar el platillo');
          this.cdRef.detectChanges(); // Forzar detección de cambios en error
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
    this.precio = platillo.precio;
    this.imageBase64 = platillo.imagen;
    this.esModoEdicion = true;
    
    // Forzar detección de cambios
    this.cdRef.detectChanges();
    
    // Scroll al formulario
    setTimeout(() => {
      document.querySelector('.form-bar')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  }

  subirsaucer() {
    // Validaciones
    if (!this.nombre || !this.descripcion || !this.precio || !this.imageBase64) {
      alert("Por favor, rellene todos los espacios");
      return;
    }

    if (this.precio <= 0) {
      alert("El precio debe ser mayor a 0");
      return;
    }

    this.isSubmitting = true;
    this.cdRef.detectChanges(); // Forzar detección de cambios al iniciar envío

    if (this.esModoEdicion && this.platilloEditando) {
      // MODO EDICIÓN
      if (!this.platilloEditando.id) {
        alert('Error: No se puede editar un platillo sin ID');
        this.isSubmitting = false;
        this.cdRef.detectChanges();
        return;
      }

      const platilloActualizado: foodInterface = {
        id: this.platilloEditando.id,
        nombre: this.nombre,
        descripcion: this.descripcion,
        precio: this.precio,
        imagen: this.imageBase64
      };

      console.log('🔄 Actualizando platillo:', platilloActualizado);

      this.foodService.actualizarPlatillo(platilloActualizado).subscribe({
        next: (respuesta) => {
          console.log('✅ Platillo actualizado exitosamente');
          this.esModoEdicion = false;
          this.isSubmitting = false;
          alert("Platillo actualizado exitosamente");
          this.limpiarFormulario();
          this.cdRef.detectChanges(); // Forzar detección de cambios después de actualizar
        },
        error: (err) => {
          console.error('❌ Error actualizando:', err);
          this.isSubmitting = false;
          alert("Error al actualizar el platillo");
          this.cdRef.detectChanges(); // Forzar detección de cambios en error
        }
      });
    } else {
      // MODO CREACIÓN
      const nuevoPlatillo: foodInterface = {
        nombre: this.nombre,
        descripcion: this.descripcion,
        precio: this.precio,
        imagen: this.imageBase64
      };

      console.log('🔄 Subiendo nuevo platillo');

      this.foodService.agregarPlatillo(nuevoPlatillo).subscribe({
        next: (respuesta) => {
          console.log('✅ Platillo agregado exitosamente');
          this.isSubmitting = false;
          alert("Platillo subido exitosamente");
          this.limpiarFormulario();
          this.cdRef.detectChanges(); // Forzar detección de cambios después de agregar
        },
        error: (err) => {
          console.error('❌ Error subiendo:', err);
          this.isSubmitting = false;
          alert("Error al subir el platillo");
          this.cdRef.detectChanges(); // Forzar detección de cambios en error
        }
      });
    }
  }

  cancelarEdicion() {
    if (confirm('¿Cancelar edición? Los cambios no guardados se perderán.')) {
      this.limpiarFormulario();
      this.cdRef.detectChanges(); // Forzar detección de cambios
    }
  }

  limpiarFormulario() {
    this.nombre = '';
    this.descripcion = '';
    this.precio = 0;
    this.imageBase64 = '';
    this.platilloEditando = null;
    this.esModoEdicion = false;
    this.isSubmitting = false;
    
    // Limpiar el input de archivo
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    this.cdRef.detectChanges(); // Forzar detección de cambios después de limpiar
  }

  getTotalPlatillos(): number {
    return this.todosLosPlatillos.length;
  }

  // Método adicional para forzar recarga manual si es necesario
  forzarRecarga() {
    console.log('🔄 Forzando recarga manual...');
    this.cargarPlatillos();
  }
}