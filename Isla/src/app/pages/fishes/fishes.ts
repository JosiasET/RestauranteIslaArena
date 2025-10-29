import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FishesService } from '../../core/service/FishesService';
import { Fish } from '../../core/interface/Fish';
import { CartService, CartItem } from '../../core/interface/cart.services';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-fishes',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './fishes.html',
  styleUrls: ['./fishes.css']
})
export class Fishes implements OnInit, OnDestroy {
  saucer: Fish[] = [];
  productosFiltrados: any[] = [];
  recomendacionesDelDia: any[] = [];
  loading: boolean = true;
  isOffline: boolean = false; // ✅ NUEVA PROPIEDAD

  // ✅ VARIABLES SIMPLIFICADAS para el modal
  mostrarModal: boolean = false;
  productoSeleccionado: any = null;
  tamanoSeleccionado: any = null;
  cantidadSeleccionada: number = 1;

  // Variable para posición del modal
  currentScrollPosition: number = 0;

  private subscription: Subscription = new Subscription();

  constructor(
    private fishesService: FishesService,
    private cartService: CartService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🔄 Inicializando componente Fishes...');
    
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

    this.cargarEspecialidades();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  cargarEspecialidades() {
    this.loading = true;
    this.cdRef.detectChanges();

    // ✅ USAR EL MÉTODO ACTUALIZADO CON OFFLINE
    this.subscription.add(
      this.fishesService.cargarEspecialidades().subscribe({
        next: (data: Fish[]) => {
          console.log("🐟 Especialidades cargadas:", data.length);
          this.saucer = data;
          
          this.productosFiltrados = data.map(producto => ({
            ...producto,
            descripcion_real: producto.descripcion_real || producto.descripcion || '',
            tiene_tamanos: producto.tiene_tamanos || false,
            tamanos: producto.tamanos || []
          }));
          
          this.generarRecomendacionesDelDia();
          this.loading = false;
          this.cdRef.detectChanges();
        },
        error: (error: any) => {
          console.error('❌ Error cargando especialidades:', error);
          this.loading = false;
          this.cdRef.detectChanges();
        }
      })
    );
  }

  // ✅ MÉTODO SIMPLIFICADO - Abrir modal
  abrirModalProducto(producto: any) {
    this.currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    this.productoSeleccionado = producto;
    
    console.log('📦 Producto seleccionado:', producto);
    
    // ✅ INICIALIZAR: Seleccionar primer tamaño por defecto
    if (producto.tiene_tamanos && producto.tamanos && producto.tamanos.length > 0) {
      this.tamanoSeleccionado = producto.tamanos[0];
    } else {
      this.tamanoSeleccionado = {
        nombre: '1 kg',
        precio: producto.precio
      };
    }
    
    this.cantidadSeleccionada = 1;
    this.mostrarModal = true;
    
    setTimeout(() => {
      this.aplicarPosicionModal();
    }, 0);
    
    this.cdRef.detectChanges();
  }

  aplicarPosicionModal() {
    const modalElement = document.querySelector('.modal-content.horizontal') as HTMLElement;
    if (modalElement) {
      const viewportHeight = window.innerHeight;
      const modalHeight = modalElement.offsetHeight;
      const scrollTop = this.currentScrollPosition;
      
      const idealPosition = scrollTop + (viewportHeight / 2) - (modalHeight / 2);
      const safePosition = Math.max(20, Math.min(idealPosition, scrollTop + (viewportHeight - modalHeight - 20)));
      
      modalElement.style.marginTop = safePosition + 'px';
    }
  }

  // ✅ MÉTODO SIMPLIFICADO - Seleccionar tamaño
  seleccionarTamano(tamano: any) {
    this.tamanoSeleccionado = tamano;
    // Resetear cantidad cuando cambia el tamaño
    this.cantidadSeleccionada = 1;
    this.cdRef.detectChanges();
  }

  // ✅ MÉTODO SIMPLIFICADO - Incrementar cantidad
  incrementarCantidad() {
    if (this.puedeIncrementar()) {
      this.cantidadSeleccionada++;
      this.cdRef.detectChanges();
    }
  }

  // ✅ MÉTODO SIMPLIFICADO - Decrementar cantidad
  decrementarCantidad() {
    if (this.cantidadSeleccionada > 1) {
      this.cantidadSeleccionada--;
      this.cdRef.detectChanges();
    }
  }

  // ✅ MÉTODO SIMPLIFICADO - Verificar si puede incrementar
  puedeIncrementar(): boolean {
    const totalKg = this.getTotalKg();
    return totalKg < this.productoSeleccionado.cantidad;
  }

  // ✅ MÉTODO SIMPLIFICADO - Calcular total en kg
  getTotalKg(): number {
    const equivalencia = this.getEquivalenciaPorUnidad(this.tamanoSeleccionado);
    return this.cantidadSeleccionada * equivalencia;
  }

  // ✅ MÉTODO SIMPLIFICADO - Calcular precio total
  getPrecioTotal(): number {
    if (!this.tamanoSeleccionado) return 0;
    return this.tamanoSeleccionado.precio * this.cantidadSeleccionada;
  }

  // ✅ MÉTODO SIMPLIFICADO - Calcular equivalencia por unidad
  getEquivalenciaPorUnidad(tamano: any): number {
    if (!tamano) return 1;
    
    const nombreTamano = tamano.nombre.toLowerCase();
    
    if (nombreTamano.includes('1/4 kg') || nombreTamano === '1/4 kg') {
      return 0.25;
    } else if (nombreTamano.includes('1/2 kg') || nombreTamano === '1/2 kg' || nombreTamano.includes('medio kg')) {
      return 0.5;
    } else if (nombreTamano.includes('1 kg') || nombreTamano === '1 kg') {
      return 1;
    } else {
      return 1;
    }
  }

  // ✅ MÉTODO SIMPLIFICADO - Agregar al carrito
  agregarAlCarritoSimplificado() {
    if (!this.productoSeleccionado) return;

    // Validar stock
    const totalKg = this.getTotalKg();
    if (totalKg > this.productoSeleccionado.cantidad) {
      alert(`❌ No hay suficiente stock. Disponible: ${this.productoSeleccionado.cantidad} kg`);
      return;
    }

    const item: CartItem = {
      id: this.productoSeleccionado.id as number,
      nombre: this.productoSeleccionado.nombre,
      descripcion: this.productoSeleccionado.descripcion_real || this.productoSeleccionado.descripcion,
      precio: this.tamanoSeleccionado.precio,
      imagen: this.productoSeleccionado.imagen,
      cantidad: this.cantidadSeleccionada,
      tamanoSeleccionado: {
        nombre: this.tamanoSeleccionado.nombre,
        precio: this.tamanoSeleccionado.precio,
        equivalenciaKg: this.getEquivalenciaPorUnidad(this.tamanoSeleccionado)
      },
      tieneTamanos: this.productoSeleccionado.tiene_tamanos,
      cantidadEnKg: totalKg
    };

    console.log('🛒 Agregando al carrito:', item);
    this.cartService.addToCart(item);
    
    // Mostrar confirmación
    this.cerrarModal();
    this.mostrarConfirmacionAgregado();
  }

  mostrarConfirmacionAgregado() {
    // Puedes implementar un toast o notificación aquí
    console.log('✅ Producto agregado al carrito');
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.productoSeleccionado = null;
    this.tamanoSeleccionado = null;
    this.cantidadSeleccionada = 1;
    this.cdRef.detectChanges();
  }

  generarRecomendacionesDelDia() {
    if (this.saucer.length === 0) return;
    if (this.saucer.length <= 4) {
      this.recomendacionesDelDia = [...this.productosFiltrados];
      return;
    }
    const productosMezclados = [...this.productosFiltrados].sort(() => Math.random() - 0.5);
    this.recomendacionesDelDia = productosMezclados.slice(0, 4);
  }

  agregarAlCarrito(producto: any) {
    this.abrirModalProducto(producto);
  }

  // ✅ MÉTODO PARA MOSTRAR ESTADO OFFLINE
  getEstadoConexion(): string {
    return this.isOffline ? '📱 Modo offline' : '🌐 En línea';
  }

  // ✅ MÉTODO PARA VER SI UNA ESPECIALIDAD ES OFFLINE
  esEspecialidadOffline(especialidad: any): boolean {
    return especialidad.id && especialidad.id.toString().includes('offline_');
  }
}