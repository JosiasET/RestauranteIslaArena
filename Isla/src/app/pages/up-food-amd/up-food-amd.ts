import { Component, OnInit, OnDestroy } from '@angular/core';
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

  nombre = '';
  descripcion = '';
  precio: number = 0;
  imageBase64: string = '';

  private subscription: Subscription = new Subscription();

  constructor(private foodService: FoodService){}

  ngOnInit() {
    console.time('CargaComponente');
    
    // Suscribirse al loading state
    this.subscription.add(
      this.foodService.loading$.subscribe(loading => {
        this.isLoading = loading;
        if (!loading) {
          console.timeEnd('CargaComponente');
        }
      })
    );

    // Suscribirse a los platillos - OPTIMIZADO: Solo cuando hay cambios
    this.subscription.add(
      this.foodService.saucer$.subscribe((platillos: foodInterface[]) => {
        console.log('🔄 Platillos actualizados:', platillos.length);
        // OPTIMIZACIÓN: No usar reverse() que es costoso, mejor orden inicial
        this.todosLosPlatillos = platillos; // Ya vienen ordenados del servidor
      })
    );

    // Forzar carga inicial
    this.cargarPlatillos();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // MÉTODO OPTIMIZADO PARA CARGAR
  cargarPlatillos() {
    console.log('🔄 Solicitando carga de platillos...');
    this.foodService.cargarPlatillos().subscribe();
  }

  // MÉTODO PARA FORZAR RECARGA
  forzarRecarga() {
    console.log('🔄 Forzando recarga...');
    this.foodService.forzarRecarga();
  }

  setSection(section: string) {
    this.activeSection = section;
  }

  OnfileSelected(event: any){
    const file = event.target.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = () =>{
        this.imageBase64 = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  eliminarPlatillo(platillo: foodInterface) {
    if (confirm('¿Estás seguro de que deseas eliminar este platillo?')) {
      this.foodService.eliminarPlatillo(platillo.id!).subscribe({
        next: () => console.log('✅ Platillo eliminado'),
        error: (err) => console.error('❌ Error eliminando:', err)
      });
    }
  }

  editarPlatillo(platillo: foodInterface) {
    this.platilloEditando = platillo;
    this.nombre = platillo.nombre;
    this.descripcion = platillo.descripcion;
    this.precio = platillo.precio;
    this.imageBase64 = platillo.imagen;
    this.esModoEdicion = true;
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

    if (this.esModoEdicion && this.platilloEditando) {
      const platilloActualizado: foodInterface = {
        id: this.platilloEditando.id,
        nombre: this.nombre,
        descripcion: this.descripcion,
        precio: this.precio,
        imagen: this.imageBase64
      };

      this.foodService.actualizarPlatillo(platilloActualizado).subscribe({
        next: () => {
          this.esModoEdicion = false;
          alert("Platillo actualizado exitosamente");
          this.limpiarFormulario();
        },
        error: (err) => console.error('❌ Error actualizando:', err)
      });
    } else {
      const nuevoPlatillo: foodInterface = {
        id: 0,
        nombre: this.nombre,
        descripcion: this.descripcion,
        precio: this.precio,
        imagen: this.imageBase64
      };

      this.foodService.agregarPlatillo(nuevoPlatillo).subscribe({
        next: () => {
          alert("Platillo subido exitosamente");
          this.limpiarFormulario();
        },
        error: (err) => console.error('❌ Error subiendo:', err)
      });
    }
  }

  cancelarEdicion() {
    if (confirm('¿Cancelar edición? Los cambios no guardados se perderán.')) {
      this.limpiarFormulario();
    }
  }

  limpiarFormulario() {
    this.nombre = '';
    this.descripcion = '';
    this.precio = 0;
    this.imageBase64 = '';
    this.platilloEditando = null;
    this.esModoEdicion = false;
  }

  getTotalPlatillos(): number {
    return this.todosLosPlatillos.length;
  }
}