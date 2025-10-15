import { Component, OnInit } from '@angular/core';
import { foodInterface } from '../../core/interface/foodInterface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodService } from '../../core/service/foodService';

@Component({
  selector: 'app-up-food-amd',
  imports: [CommonModule, FormsModule],
  templateUrl: './up-food-amd.html',
  styleUrl: './up-food-amd.css' 
})
export class UpFoodAmd implements OnInit {
  activeSection: String = 'upfood';
  ultimosPlatillos: foodInterface[] = [];
  platilloEditando: foodInterface | null = null;
  esModoEdicion: boolean = false;

  nombre = '';
  descripcion = '';
  precio: number = 0;
  imageBase64: string = '';

  constructor(private foodService: FoodService){}

  ngOnInit() {
    this.foodService.saucer$.subscribe((platillos: foodInterface[]) => {
      this.ultimosPlatillos = platillos.slice(-5).reverse();
    });
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
     this.foodService.eliminarPlatillo(platillo.id!);

    }
  }

  editarPlatillo(platillo: foodInterface) {
    this.platilloEditando = platillo;
    this.nombre = platillo.nombre;
    this.descripcion = platillo.descripcion;
    this.precio = platillo.precio;
    this.imageBase64 = platillo.imagen;
    this.esModoEdicion = true;
    
    // Scroll al formulario para mejor UX
    setTimeout(() => {
      const formElement = document.querySelector('.Subir_p');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
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

    if (this.esModoEdicion && this.platilloEditando) {
      // Modo edición
      const platilloActualizado: foodInterface = {
        id: this.platilloEditando.id,
        nombre: this.nombre,
        descripcion: this.descripcion,
        precio: this.precio,
        imagen: this.imageBase64
      };

     this.foodService.actualizarPlatillo(platilloActualizado);
      this.esModoEdicion = false;
      alert("Platillo actualizado exitosamente");
      this.limpiarFormulario();
    } else {
      // Modo creación
      const nuevoPlatillo: foodInterface = {
        id: 0, // El servicio asignará el ID correcto
        nombre: this.nombre,
        descripcion: this.descripcion,
        precio: this.precio,
        imagen: this.imageBase64
      };

      this.foodService.agregarPlatillo(nuevoPlatillo);
      alert("Platillo subido exitosamente");
      this.limpiarFormulario();
    }
  }

  cancelarEdicion() {
    if (confirm('¿Cancelar edición? Los cambios no guardados se perderán.')) {
      this.limpiarFormulario();
    }
  }

  

  private limpiarFormulario() {
    this.nombre = '';
    this.descripcion = '';
    this.precio = 0;
    this.imageBase64 = '';
    this.platilloEditando = null;
    this.esModoEdicion = false;
    
    // Limpiar input file
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}