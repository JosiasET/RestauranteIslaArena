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

    // 🔥 FORZAR CARGA INICIAL - ESTO ES LO QUE FALTA
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

  // ... el resto de tus métodos se mantienen igual
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
    const cartItem: CartItem = {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      imagen: producto.imagen,
      cantidad: 1
    };
    this.cartService.addToCart(cartItem);
  }
}