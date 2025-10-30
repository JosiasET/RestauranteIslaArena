import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Drinkinterface } from '../../../core/interface/drink';
import { DrinkService } from '../../../core/service/DrinkService';

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
  isOffline: boolean = false; // ✅ NUEVA PROPIEDAD

  nombre = '';
  descripcion = '';
  precio: number = 0;
  imageBase64: string = '';
  stock: number = 0;

  private subscription: Subscription = new Subscription();

  constructor(
    private drinkService: DrinkService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('🔄 Inicializando componente UpDrinkAmd...');
    
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

    // Suscribirse al loading state
    this.subscription.add(
      this.drinkService.loading$.subscribe(loading => {
        this.isLoading = loading;
        this.cdRef.detectChanges();
      })
    );

    // Suscribirse a las bebidas
    this.subscription.add(
      this.drinkService.saucer$.subscribe((bebidas: Drinkinterface[]) => {
        console.log('🔄 Lista de bebidas actualizada:', bebidas.length);
        this.todasLasBebidas = bebidas;
        this.cdRef.detectChanges();
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

  // ✅ CORREGIDO - Manejar IDs string y number
  eliminarBebida(bebida: Drinkinterface) {
  if (confirm('¿Estás seguro de que deseas eliminar esta bebida?')) {
    // ✅ CORRECCIÓN - Manejar correctamente string y number
    let idParaEliminar: number;
    
    if (typeof bebida.id === 'string') {
      // Si es string, intentar convertir a número
      idParaEliminar = parseInt(bebida.id);
      // Si no es un número válido, usar un valor por defecto
      if (isNaN(idParaEliminar)) {
        idParaEliminar = 0; // Valor temporal para offline
      }
    } else {
      idParaEliminar = bebida.id;
    }

    this.drinkService.eliminarBebida(idParaEliminar).subscribe({
      next: () => {
        console.log('✅ Bebida eliminada');
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
    this.stock = bebida.cantidad_productos;
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
        imagen: this.imageBase64,
        cantidad_productos: this.stock
      };

      this.drinkService.actualizarBebida(bebidaActualizada).subscribe({
        next: (bebidaActualizadaResp: Drinkinterface) => {
          this.esModoEdicion = false;
          this.isSubmitting = false;
          
          // ✅ MENSAJE MEJORADO
            alert("📱 Bebida actualizada localmente - Se sincronizará cuando haya internet");
            alert("✅ Bebida actualizada exitosamente en el servidor");
        
          
          this.limpiarFormulario();
        },
        error: (err: any) => {
          console.error('❌ Error actualizando:', err);
          this.isSubmitting = false;
          alert("❌ Error al actualizar la bebida: " + err.message);
        }
      });
    } else {
      // MODO CREACIÓN
      const nuevaBebida: Drinkinterface = {
        id: 0, // ID temporal
        nombre: this.nombre,
        descripcion: this.descripcion,
        precio: this.precio,
        imagen: this.imageBase64,
        cantidad_productos: this.stock
      };

      this.drinkService.agregarBebida(nuevaBebida).subscribe({
        next: (nuevaBebidaResp: Drinkinterface) => {
          this.isSubmitting = false;
          
          // ✅ MENSAJE MEJORADO
            alert("📱 Bebida guardada localmente - Se subirá automáticamente cuando recuperes internet");

            alert("✅ Bebida subida exitosamente al servidor");
 
          
          this.limpiarFormulario();
        },
        error: (err: any) => {
          console.error('❌ Error subiendo:', err);
          this.isSubmitting = false;
          alert("❌ Error al subir la bebida: " + err.message);
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
    this.stock = 0;
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

  // ✅ MÉTODO PARA MENSAJE OFFLINE
  getMensajeEstado(): string {
    return this.isOffline ? '📱 Modo offline - Los cambios se guardarán localmente' : '🌐 Conectado';
  }

  // ✅ MÉTODO PARA VER SI UNA BEBIDA ES OFFLINE
  
}