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

  // Variables para el modal de tamaños
  mostrarModal: boolean = false;
  productoSeleccionado: any = null;
  tipoSeleccionado: any = null;
  tamanoSeleccionado: any = null;
  cantidad: number = 1;

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
    this.cargarProductosComida();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  cargarProductosComida() {
    this.loading = true;
    this.cdRef.detectChanges();

    this.foodService.cargarPlatillos().subscribe();

    this.subscription.add(
      this.foodService.saucer$.subscribe(comidas => {
        console.log('🍽️ Productos cargados:', comidas.length);
        this.todosProductos = comidas;
        this.generarRecomendacionesDelDia();
        this.filtrarProductos();
        this.loading = false;
        this.cdRef.detectChanges();
      })
    );
  }

  // MÉTODOS PARA EL MODAL DE TAMAÑOS
  abrirModalProducto(producto: any) {
  this.productoSeleccionado = producto;
  
  console.log('📦 Producto seleccionado:', producto); // Debug
  
  // Si el producto tiene tamaños, seleccionar el primero
  if (producto.tiene_tamanos && producto.tamanos && producto.tamanos.length > 0) {
    this.tamanoSeleccionado = producto.tamanos[0];
  } else {
    // Si no tiene tamaños, usar el precio base
    this.tamanoSeleccionado = {
      nombre: 'Único',
      precio: producto.precio
    };
  }
  
  this.cantidad = 1;
  this.mostrarModal = true;
  this.cdRef.detectChanges();
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
    this.cantidad++;
    this.cdRef.detectChanges();
  }

  decrementarCantidad() {
    if (this.cantidad > 1) {
      this.cantidad--;
      this.cdRef.detectChanges();
    }
  }

  // En tu componente del modal, modifica la función agregarConOpciones
agregarConOpciones() {
  if (!this.productoSeleccionado) return;

  // Calcular el precio final (del tamaño seleccionado o precio base)
  const precioFinal = this.getPrecioFinal();

  const item: CartItem = {
    id: this.productoSeleccionado.id,
    nombre: this.productoSeleccionado.nombre,
    descripcion: this.productoSeleccionado.descripcion_real || this.productoSeleccionado.descripcion,
    precio: precioFinal, // Precio del tamaño seleccionado
    imagen: this.productoSeleccionado.imagen,
    cantidad: this.cantidad,
    // INFORMACIÓN DEL TAMAÑO SELECCIONADO
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

  cerrarModal() {
    this.mostrarModal = false;
    this.productoSeleccionado = null;
    this.tipoSeleccionado = null;
    this.tamanoSeleccionado = null;
    this.cantidad = 1;
    this.cdRef.detectChanges();
  }

  // MÉTODOS EXISTENTES (se mantienen igual)
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
    // Siempre abrir modal para selección de opciones
    this.abrirModalProducto(producto);
  }

 
}