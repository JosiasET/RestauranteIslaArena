import { Component, OnInit } from '@angular/core';
import { DrinkService } from '../../core/service/DrinkService';
import { Drinkinterface } from '../../core/interface/drink';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-up-drink-amd',
  imports: [CommonModule, FormsModule],
  templateUrl: './up-drink-amd.html',
  styleUrl: './up-drink-amd.css'
})
export class UpDrinkAmd implements OnInit {
  activeSection: string = 'upfood';
  todosLosPlatillos: Drinkinterface[] = []; // ← CAMBIADO: todos los platillos
  platilloEditando: Drinkinterface | null = null;
  esModoEdicion: boolean = false;

  nombre = '';
  descripcion = '';
  precio: number = 0;
  imageBase64: string = '';

  constructor(private drinkService: DrinkService) {}

  ngOnInit() {
    this.drinkService.saucer$.subscribe(bebidas => {
      this.todosLosPlatillos = [...bebidas].reverse(); // ← TODOS los platillos
    });
  }

  OnfileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imageBase64 = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  eliminarPlatillo(platillo: Drinkinterface) {
    if (confirm('¿Estás seguro de que deseas eliminar esta bebida?')) {
      this.drinkService.eliminarPlatillo(platillo);
    }
  }

  editarPlatillo(platillo: Drinkinterface) {
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
      const bebidaActualizada: Drinkinterface = {
        id: this.platilloEditando.id,
        nombre: this.nombre,
        descripcion: this.descripcion,
        precio: this.precio,
        imagen: this.imageBase64
      };

      this.drinkService.actualizarPlatillo(this.platilloEditando, bebidaActualizada);
      this.esModoEdicion = false;
      alert("Bebida actualizada exitosamente");
      this.limpiarFormulario();
    } else {
      const nuevaBebida: Drinkinterface = {
        id: 0,
        nombre: this.nombre,
        descripcion: this.descripcion,
        precio: this.precio,
        imagen: this.imageBase64
      };

      this.drinkService.agregarPlatillo(nuevaBebida);
      alert("Bebida subida exitosamente");
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

    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // NUEVO: Método para obtener total de bebidas
  getTotalPlatillos(): number {
    return this.todosLosPlatillos.length;
  }
}