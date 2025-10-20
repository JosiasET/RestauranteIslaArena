import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DrinkService } from '../../core/service/DrinkService';
import { Drinkinterface } from '../../core/interface/drink';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-up-drink-amd',
  imports: [CommonModule, FormsModule],
  templateUrl: './up-drink-amd.html',
  styleUrl: './up-drink-amd.css'
})
export class UpDrinkAmd implements OnInit, OnDestroy {
  activeSection: string = 'upfood';
  todasLasBebidas: Drinkinterface[] = [];
  bebidaEditando: Drinkinterface | null = null;
  esModoEdicion: boolean = false;
  isLoading: boolean = true;
  isSubmitting: boolean = false;

  nombre = '';
  descripcion = '';
  precio: number = 0;
  imageBase64: string = '';

  private subscription: Subscription = new Subscription();

  constructor(
    private drinkService: DrinkService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('🔄 Inicializando componente UpDrinkAmd...');
    
    // Suscribirse al loading state
    this.subscription.add(
      this.drinkService.loading$.subscribe(loading => {
        this.isLoading = loading;
        this.cdRef.detectChanges();
      })
    );

    // Suscribirse a las bebidas - ESTO ES LO MÁS IMPORTANTE
    this.subscription.add(
      this.drinkService.saucer$.subscribe((bebidas: Drinkinterface[]) => {
        console.log('🔄 Lista de bebidas actualizada:', bebidas.length);
        this.todasLasBebidas = bebidas;
        this.cdRef.detectChanges(); // ESTO HACE EL REFRESH AUTOMÁTICO
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
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

  eliminarBebida(bebida: Drinkinterface) {
    if (confirm('¿Estás seguro de que deseas eliminar esta bebida?')) {
      this.drinkService.eliminarBebida(bebida.id!).subscribe({
        next: () => {
          console.log('✅ Bebida eliminada');
          // El refresh automático se hace por la suscripción a saucer$
        },
        error: (err) => {
          console.error('❌ Error eliminando bebida:', err);
          alert('Error al eliminar la bebida');
        }
      });
    }
  }

  editarBebida(bebida: Drinkinterface) {
    this.bebidaEditando = bebida;
    this.nombre = bebida.nombre;
    this.descripcion = bebida.descripcion;
    this.precio = bebida.precio;
    this.imageBase64 = bebida.imagen;
    this.esModoEdicion = true;
  }

  subirBebida() {
    if (!this.nombre || !this.descripcion || !this.precio || !this.imageBase64) {
      alert("Por favor, rellene todos los espacios");
      return;
    }

    if (this.precio <= 0) {
      alert("El precio debe ser mayor a 0");
      return;
    }

    this.isSubmitting = true;

    if (this.esModoEdicion && this.bebidaEditando) {
      // MODO EDICIÓN
      const bebidaActualizada: Drinkinterface = {
        id: this.bebidaEditando.id,
        nombre: this.nombre,
        descripcion: this.descripcion,
        precio: this.precio,
        imagen: this.imageBase64
      };

      this.drinkService.actualizarBebida(bebidaActualizada).subscribe({
        next: () => {
          this.esModoEdicion = false;
          this.isSubmitting = false;
          alert("Bebida actualizada exitosamente");
          this.limpiarFormulario();
          // El refresh automático se hace por la suscripción a saucer$
        },
        error: (err) => {
          console.error('❌ Error actualizando:', err);
          this.isSubmitting = false;
          alert("Error al actualizar la bebida");
        }
      });
    } else {
      // MODO CREACIÓN - AGREGAR ID: 0 TEMPORAL
      const nuevaBebida: Drinkinterface = {
        id: 0, // ID temporal que será reemplazado por el backend
        nombre: this.nombre,
        descripcion: this.descripcion,
        precio: this.precio,
        imagen: this.imageBase64
      };

      this.drinkService.agregarBebida(nuevaBebida).subscribe({
        next: () => {
          this.isSubmitting = false;
          alert("Bebida subida exitosamente");
          this.limpiarFormulario();
          // El refresh automático se hace por la suscripción a saucer$
        },
        error: (err) => {
          console.error('❌ Error subiendo:', err);
          this.isSubmitting = false;
          alert("Error al subir la bebida");
        }
      });
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
    this.bebidaEditando = null;
    this.esModoEdicion = false;
    this.isSubmitting = false;

    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getTotalBebidas(): number {
    return this.todasLasBebidas.length;
  }
}