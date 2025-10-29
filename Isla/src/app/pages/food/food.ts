import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../core/interface/cart.services';
import { FoodService } from '../../core/service/foodService';
import { foodInterface } from '../../core/interface/foodInterface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-food',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, CommonModule],
  templateUrl: './food.html',
  styleUrl: './food.css'
})
export class Food implements OnInit, OnDestroy {
  todosProductos: any[] = [];
  productosFiltrados: any[] = [];
  recomendacionesDelDia: any[] = [];
  loading: boolean = true;
  categoriaSeleccionada: string = 'todas';
  isOffline: boolean = false;

  // Variables para el modal de tamaños
  mostrarModal: boolean = false;
  productoSeleccionado: any = null;
  tipoSeleccionado: any = null;
  tamanoSeleccionado: any = null;
  cantidad: number = 1;

  // Variable para posición del modal
  currentScrollPosition: number = 0;

  categorias = [
    { id: 'todas', nombre: 'Todo el Menú', emoji: '📦' },
    { id: 'platillos', nombre: 'Platillos', emoji: '🍽️' },
    { id: 'sopas', nombre: 'Sopas', emoji: '🍲' },
    { id: 'por-kilo', nombre: 'Por Kilo', emoji: '⚖️' },
    { id: 'ensalada', nombre: 'Ensalada', emoji: '🥗' },
    { id: 'ceviche', nombre: 'Ceviche', emoji: '🐟' },
    { id: 'cocteles', nombre: 'Cocteles', emoji: '🍤' }
  ];

  private subscription: Subscription = new Subscription();

  constructor(
    private foodService: FoodService,
    private cartService: CartService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🔄 Inicializando componente Food...');
    
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

    this.cargarProductosComida();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  cargarProductosComida() {
    this.loading = true;
    this.cdRef.detectChanges();

    // ✅ SUSCRIBIRSE AL BEHAVIORSUBJECT EN LUGAR DE HACER NUEVA PETICIÓN
    this.subscription.add(
      this.foodService.saucer$.subscribe({
        next: (comidas: foodInterface[]) => {
          console.log('🍽️ Productos actualizados desde BehaviorSubject:', comidas.length);
          this.todosProductos = comidas;
          this.generarRecomendacionesDelDia();
          this.filtrarProductos();
          this.loading = false;
          this.cdRef.detectChanges();
        },
        error: (error: any) => {
          console.error('❌ Error en BehaviorSubject:', error);
          this.loading = false;
          this.cdRef.detectChanges();
        }
      })
    );

    // ✅ SUSCRIBIRSE AL ESTADO DE LOADING
    this.subscription.add(
      this.foodService.loading$.subscribe(loading => {
        this.loading = loading;
        this.cdRef.detectChanges();
      })
    );

    // ✅ SOLO CARGAR DESDE API SI NO HAY DATOS EN EL BEHAVIORSUBJECT
    const platillosActuales = this.foodService.getPlatillosActuales();
    if (platillosActuales.length === 0) {
      console.log('🔄 No hay platillos en cache, cargando desde API...');
      this.foodService.cargarPlatillos().subscribe();
    }
  }

  // ✅ MANTENER TODOS LOS MÉTODOS EXISTENTES SIN CAMBIOS
  abrirModalProducto(producto: any) {
    this.currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    this.productoSeleccionado = producto;
    
    console.log('📦 Producto seleccionado:', producto);
    
    if (producto.tiene_tamanos && producto.tamanos && producto.tamanos.length > 0) {
      this.tamanoSeleccionado = producto.tamanos[0];
    } else {
      this.tamanoSeleccionado = {
        nombre: 'Único',
        precio: producto.precio
      };
    }
    
    this.cantidad = 1;
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

  seleccionarTipo(tipo: any) {
    this.tipoSeleccionado = tipo;
    if (tipo.tamanos && tipo.tamanos.length > 0) {
      this.tamanoSeleccionado = tipo.tamanos[0];
    }
    this.cdRef.detectChanges();
  }

  seleccionarTamano(tamano: any) {
    this.tamanoSeleccionado = tamano;
    this.cdRef.detectChanges();
  }

  incrementarCantidad() {
    if (this.cantidad >= 10) {
      alert('❌ Límite máximo: 10 unidades por pedido');
      return;
    }
    this.cantidad++;
    this.cdRef.detectChanges();
  }

  decrementarCantidad() {
    if (this.cantidad > 1) {
      this.cantidad--;
      this.cdRef.detectChanges();
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.productoSeleccionado = null;
    this.tipoSeleccionado = null;
    this.tamanoSeleccionado = null;
    this.cantidad = 1;
    this.cdRef.detectChanges();
  }

  agregarConOpciones() {
    if (!this.productoSeleccionado) return;

    if (this.cantidad > 10) {
      alert('❌ Límite máximo: 10 unidades por pedido');
      return;
    }

    const precioFinal = this.getPrecioFinal();

    const item: CartItem = {
      id: this.productoSeleccionado.id as number,
      nombre: this.productoSeleccionado.nombre,
      descripcion: this.productoSeleccionado.descripcion_real || this.productoSeleccionado.descripcion,
      precio: precioFinal,
      imagen: this.productoSeleccionado.imagen,
      cantidad: this.cantidad,
      tamanoSeleccionado: this.tamanoSeleccionado ? {
        nombre: this.tamanoSeleccionado.nombre,
        precio: this.tamanoSeleccionado.precio
      } : undefined,
      tieneTamanos: this.productoSeleccionado.tiene_tamanos
    };

    console.log('🛒 Agregando al carrito:', {
      nombre: item.nombre,
      precio: item.precio,
      tamano: item.tamanoSeleccionado,
      cantidad: item.cantidad
    });

    this.cartService.addToCart(item);
    this.cerrarModal();
  }

  getPrecioFinal(): number {
    if (this.tamanoSeleccionado) {
      return this.tamanoSeleccionado.precio;
    }
    return this.productoSeleccionado?.precio || 0;
  }

  generarRecomendacionesDelDia() {
    if (this.todosProductos.length === 0) return;
    if (this.todosProductos.length <= 4) {
      this.recomendacionesDelDia = [...this.todosProductos];
      return;
    }
    const productosMezclados = [...this.todosProductos].sort(() => Math.random() - 0.5);
    this.recomendacionesDelDia = productosMezclados.slice(0, 4);
  }

  inferirCategoria(descripcion: string, nombre: string): string {
    const desc = descripcion.toLowerCase();
    const nom = nombre.toLowerCase();
    if (desc.includes('ensalada') || nom.includes('ensalada')) return 'ensalada';
    if (desc.includes('ceviche') || nom.includes('ceviche')) return 'ceviche';
    if (desc.includes('coctel') || nom.includes('coctel') || desc.includes('camarón') || desc.includes('marisco')) return 'cocteles';
    if (desc.includes('kilo') || desc.includes('kg') || desc.includes('por kilo') || nom.includes('kilo') || nom.includes('kg')) return 'por-kilo';
    if (desc.includes('sopa') || nom.includes('sopa') || desc.includes('caldo') || nom.includes('caldo')) return 'sopas';
    return 'platillos';
  }

  seleccionarCategoria(categoriaId: string) {
    this.categoriaSeleccionada = categoriaId;
    this.filtrarProductos();
    this.cdRef.detectChanges();
  }

  filtrarProductos() {
    if (this.categoriaSeleccionada === 'todas') {
      this.productosFiltrados = [...this.todosProductos];
    } else {
      this.productosFiltrados = this.todosProductos.filter(producto => {
        const categoria = this.inferirCategoria(producto.descripcion, producto.nombre);
        return categoria === this.categoriaSeleccionada;
      });
    }
  }

  agregarAlCarrito(producto: any) {
    this.abrirModalProducto(producto);
  }

  // ✅ MÉTODO PARA MOSTRAR ESTADO OFFLINE
  getEstadoConexion(): string {
    return this.isOffline ? '📱 Modo offline' : '🌐 En línea';
  }

  // ✅ MÉTODO PARA VER SI UN PLATILLO ES OFFLINE
  esPlatilloOffline(platillo: any): boolean {
    return platillo.id && platillo.id.toString().includes('offline_');
  }

  // ✅ MÉTODO OPCIONAL PARA FORZAR RECARGA SI ES NECESARIO
  recargarPlatillos() {
    console.log('🔄 Recargando platillos manualmente...');
    this.loading = true;
    this.foodService.cargarPlatillos().subscribe();
  }
}