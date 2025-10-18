import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FishesService } from '../../core/service/FishesService';
import { Fish } from '../../core/interface/Fish';

@Component({
  selector: 'app-up-fishes-amd',
  imports: [CommonModule, FormsModule],
  templateUrl: './up-fishes-amd.html',
  styleUrls: ['./up-fishes-amd.css']
})
export class UpFishesAmd implements OnInit {
  activeSection: string = 'upfishes';
  todosLosPlatillos: Fish[] = []; // ← CAMBIADO: todos los platillos
  platilloEditando: Fish | null = null;
  esModoEdicion: boolean = false;

  nombre = '';
  descripcion = '';
  precio: number = 0;
  imageBase64: string = '';

  constructor(private fishesService: FishesService) {}

  ngOnInit() {
    this.fishesService.saucer$.subscribe((platillos: Fish[]) => {
      this.todosLosPlatillos = [...platillos].reverse(); // ← TODOS los platillos
    });
  }

  setSection(section: string) {
    this.activeSection = section;
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

  eliminarPlatillo(platillo: Fish) {
    if (confirm('¿Estás seguro de que deseas eliminar esta especialidad?')) {
      this.fishesService.eliminarPlatillo(platillo);
    }
  }

  editarPlatillo(platillo: Fish) {
    this.platilloEditando = platillo;
    this.nombre = platillo.nombre;
    this.descripcion = platillo.descripcion;
    this.precio = platillo.precio;
    this.imageBase64 = platillo.imagen;
    this.esModoEdicion = true;
  }

  subirsaucer() {
    if (!this.nombre || !this.descripcion || !this.precio || !this.imageBase64) {
      alert('Por favor, rellene todos los espacios');
      return;
    }

    if (this.precio <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }

    if (this.esModoEdicion && this.platilloEditando) {
      const especialidadActualizada: Fish = {
        id: this.platilloEditando.id,
        nombre: this.nombre,
        descripcion: this.descripcion,
        precio: this.precio,
        imagen: this.imageBase64
      };

      this.fishesService.actualizarPlatillo(this.platilloEditando, especialidadActualizada);
      this.esModoEdicion = false;
      alert('Especialidad actualizada exitosamente');
      this.limpiarFormulario();
    } else {
      const nuevaEspecialidad: Fish = {
        id: 0,
        nombre: this.nombre,
        descripcion: this.descripcion,
        precio: this.precio,
        imagen: this.imageBase64
      };

      this.fishesService.agregarPlatillo(nuevaEspecialidad);
      alert('Especialidad subida exitosamente');
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
    if (fileInput) fileInput.value = '';
  }

  // NUEVO: Método para obtener total de platillos
  getTotalPlatillos(): number {
    return this.todosLosPlatillos.length;
  }
}