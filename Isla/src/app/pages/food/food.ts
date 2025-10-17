import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../core/interface/cart.services';
import { FoodService } from '../../core/service/foodService';
import { foodInterface } from '../../core/interface/foodInterface';

@Component({
  selector: 'app-food',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, CommonModule],
  templateUrl: './food.html',
  styleUrl: './food.css'
})
export class Food implements OnInit {
  // Todos los productos combinados
  todosProductos: any[] = [];
  productosFiltrados: any[] = [];
  recomendacionesDelDia: any[] = [];
  loading: boolean = true;
  categoriaSeleccionada: string = 'todas';

  // Categorías del menú
  categorias = [
    { id: 'todas', nombre: 'Todo el Menú', emoji: '📦' },
    { id: 'platillos', nombre: 'Platillos', emoji: '🍽️' },
    { id: 'sopas', nombre: 'Sopas', emoji: '🍲' },
    { id: 'por-kilo', nombre: 'Por Kilo', emoji: '⚖️' },
    { id: 'ensalada', nombre: 'Ensalada', emoji: '🥗' },
    { id: 'ceviche', nombre: 'Ceviche', emoji: '🐟' },
    { id: 'cocteles', nombre: 'Cocteles', emoji: '🍤' }
  ];

  constructor(
    private foodService: FoodService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.cargarProductosComida();
  }

  cargarProductosComida() {
    this.foodService.saucer$.subscribe(comidas => {
      this.todosProductos = comidas; // Solo productos de comida
      this.generarRecomendacionesDelDia();
      this.loading = false;
      this.filtrarProductos();
    });
  }

  generarRecomendacionesDelDia() {
  if (this.todosProductos.length === 0) return;

  // Si hay 3 o menos productos, mostrar todos
  if (this.todosProductos.length <= 4) {
    this.recomendacionesDelDia = [...this.todosProductos];
    return;
  }

  // Mezclar array de forma verdaderamente aleatoria
  const productosMezclados = [...this.todosProductos]
    .sort(() => Math.random() - 0.5);

  // Tomar los primeros 3 productos mezclados
  this.recomendacionesDelDia = productosMezclados.slice(0, 4);
  
  console.log('🎲 Recomendaciones del día:', this.recomendacionesDelDia.map(p => p.nombre));
}

  // Método para inferir categoría
  inferirCategoria(descripcion: string, nombre: string): string {
    const desc = descripcion.toLowerCase();
    const nom = nombre.toLowerCase();
    
    // 🥗 ENSALADA
    if (desc.includes('ensalada') || nom.includes('ensalada')) {
      return 'ensalada';
    }
    
    // 🐟 CEVICHE
    if (desc.includes('ceviche') || nom.includes('ceviche')) {
      return 'ceviche';
    }
    
    // 🍤 COCTELES
    if (desc.includes('coctel') || nom.includes('coctel') || 
        desc.includes('camarón') || desc.includes('marisco')) {
      return 'cocteles';
    }
    
    // ⚖️ POR KILO
    if (desc.includes('kilo') || desc.includes('kg') || desc.includes('por kilo') ||
        nom.includes('kilo') || nom.includes('kg')) {
      return 'por-kilo';
    }
    
    // 🍲 SOPAS
    if (desc.includes('sopa') || nom.includes('sopa') || 
        desc.includes('caldo') || nom.includes('caldo')) {
      return 'sopas';
    }
    
    // 🍽️ PLATILLOS (todo lo demás)
    return 'platillos';
  }

  seleccionarCategoria(categoriaId: string) {
    this.categoriaSeleccionada = categoriaId;
    this.filtrarProductos();
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
      id: Date.now(),
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      imagen: producto.imagen,
      cantidad: 1
    };

    this.cartService.addToCart(cartItem);
    //alert(`${producto.nombre} agregado al carrito!`);
  }
}