import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FishesService } from '../../core/service/FishesService';
import { Fish } from '../../core/interface/Fish';

@Component({
  selector: 'app-up-fishes-amd',
  imports: [CommonModule, FormsModule],
  templateUrl: './up-fishes-amd.html',
  styleUrl: './up-fishes-amd.css'
})
export class UpFishesAmd implements OnInit {
  activeSection: String = 'upfood';
  ultimosPlatillos: Fish[] = [];
  platilloEditando: Fish | null = null;
  esModoEdicion: boolean = false;

  nombre = '';
  descripcion = '';
  precio: number = 0;
  imageBase64: string = '';

  constructor(private foodservice: FishesService){}

  ngOnInit() {
    this.foodservice.saucer$.subscribe(platillos => {
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

  eliminarPlatillo(platillo: Fish) {
    if (confirm('¿Estás seguro de que deseas eliminar esta especialidad?')) {
      this.foodservice.eliminarPlatillo(platillo);
    }
  }

  editarPlatillo(platillo: Fish) {
    this.platilloEditando = platillo; // No usar spread, mantener referencia
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
      const platilloActualizado: Fish = {
        id: this.platilloEditando.id,
        nombre: this.nombre,
        descripcion: this.descripcion,
        precio: this.precio,
        imagen: this.imageBase64
      };

      this.foodservice.actualizarPlatillo(this.platilloEditando, platilloActualizado);
      this.esModoEdicion = false;
      alert("Especialidad actualizada exitosamente");
      this.limpiarFormulario();
    } else {
      // Modo creación
      const newsaucer: Fish = {
        id: 0, // El servicio asignará el ID correcto
        nombre: this.nombre,
        descripcion: this.descripcion,
        precio: this.precio,
        imagen: this.imageBase64
      };

      this.foodservice.agregarPlatillo(newsaucer);
      alert("Especialidad subida exitosamente");
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