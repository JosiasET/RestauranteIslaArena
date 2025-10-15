import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DrinkService } from '../../core/service/DrinkService';
import { FoodService } from '../../core/service/foodService';
import { FishesService } from '../../core/service/FishesService';
import { SaleDataService } from '../../core/service/SaleDataService';
import { Drinkinterface } from '../../core/interface/drink';
import { foodInterface } from '../../core/interface/foodInterface';
import { Fish } from '../../core/interface/Fish';

interface CartItem {
  product: any;
  quantity: number;
}

@Component({
  selector: 'app-up-sales-amd',
  imports: [CommonModule, FormsModule], // ← Quité CurrencyPipe y RouterLink
  templateUrl: './up-sales-amd.html',
  styleUrl: './up-sales-amd.css'
})
export class UpSalesAmd implements OnInit {
  // Sale data
  selectedTable: string = '';
  selectedWaiter: string = '';
  selectedCategory: string = 'food';
  
  // Catalogs
  drinks: Drinkinterface[] = [];
  foods: foodInterface[] = [];
  fishes: Fish[] = [];
  filteredProducts: any[] = [];
  
  // Cart
  cart: CartItem[] = [];
  
  // Static lists
  tables: string[] = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6'];
  waiters: string[] = ['Mesero 1', 'Mesero 2'];

  constructor(
    private drinkService: DrinkService,
    private foodService: FoodService,
    private fishesService: FishesService,
    private saleDataService: SaleDataService,
    private router: Router
  ) {}

  ngOnInit() {
  // Load drinks
  this.drinkService.saucer$.subscribe(drinks => {
    console.log('🥤 BEBIDAS DETALLADAS:', drinks.map(d => ({
      id: d.id, 
      nombre: d.nombre,
      precio: d.precio
    })));
    this.drinks = drinks;
    this.updateFilteredProducts();
  });
  
  // Load foods
  this.foodService.saucer$.subscribe(foods => {
    console.log('🍽️ COMIDAS DETALLADAS:', foods.map(f => ({
      id: f.id, 
      nombre: f.nombre, 
      precio: f.precio
    })));
    this.foods = foods;
    this.updateFilteredProducts();
  });
  
  // Load fishes
  this.fishesService.saucer$.subscribe(fishes => {
    console.log('🐟 PESCADOS DETALLADOS:', fishes.map(f => ({
      id: f.id, 
      nombre: f.nombre,
      precio: f.precio
    })));
    this.fishes = fishes;
    this.updateFilteredProducts();
  });
}

  updateFilteredProducts() {
    switch (this.selectedCategory) {
      case 'food':
        this.filteredProducts = [...this.foods];
        break;
      case 'drinks':
        this.filteredProducts = [...this.drinks];
        break;
      case 'fish':
        this.filteredProducts = [...this.fishes];
        break;
      case 'all':
        this.filteredProducts = [...this.foods, ...this.drinks, ...this.fishes];
        break;
      default:
        this.filteredProducts = [...this.foods, ...this.drinks, ...this.fishes];
    }
  }

  filterProducts() {
    this.updateFilteredProducts();
  }

  addToCart(product: any) {
  // Determinar de qué array viene el producto
  let productType = 'unknown';
  
  if (this.drinks.some(d => d.id === product.id && d.nombre === product.nombre)) {
    productType = 'drink';
  } else if (this.foods.some(f => f.id === product.id && f.nombre === product.nombre)) {
    productType = 'food';
  } else if (this.fishes.some(f => f.id === product.id && f.nombre === product.nombre)) {
    productType = 'fish';
  }
  
  // Crear ID único
  const uniqueId = `${productType}_${product.id}_${product.nombre}`;
  
  console.log('🎯 PRODUCTO CLICKEADO:', product.nombre, 'ID Único:', uniqueId);
  
  // Buscar por ID único
  const existingItem = this.cart.find(item => {
    const itemType = this.drinks.some(d => d.id === item.product.id && d.nombre === item.product.nombre) ? 'drink' :
                    this.foods.some(f => f.id === item.product.id && f.nombre === item.product.nombre) ? 'food' :
                    this.fishes.some(f => f.id === item.product.id && f.nombre === item.product.nombre) ? 'fish' : 'unknown';
    
    const itemUniqueId = `${itemType}_${item.product.id}_${item.product.nombre}`;
    return itemUniqueId === uniqueId;
  });
  
  if (existingItem) {
    console.log('❌ YA EXISTE - Sumando cantidad');
    existingItem.quantity++;
  } else {
    console.log('✅ NUEVO PRODUCTO');
    this.cart.push({
      product: product,
      quantity: 1
    });
  }
}

  increaseQuantity(index: number) {
    this.cart[index].quantity++;
  }

  decreaseQuantity(index: number) {
    if (this.cart[index].quantity > 1) {
      this.cart[index].quantity--;
    } else {
      this.removeFromCart(index);
    }
  }

  removeFromCart(index: number) {
    this.cart.splice(index, 1);
  }

  calculateTotal(): number {
    return this.cart.reduce((total, item) => {
      return total + (item.product.precio * item.quantity);
    }, 0);
  }

  clearCart() {
    if (confirm('¿Estás seguro de que deseas limpiar el carrito?')) {
      this.cart = [];
    }
  }

  processSale() {
    if (!this.selectedTable) {
      alert('Por favor, selecciona una mesa');
      return;
    }

    if (this.cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    // Prepare sale data for checkout
    const saleData = {
      table: this.selectedTable,
      waiter: this.selectedWaiter || 'No asignado',
      products: [...this.cart],
      total: this.calculateTotal(),
      date: new Date()
    };

    // Guardar datos en el servicio
    this.saleDataService.setSaleData(saleData);

    // Navigate to cashier checkout
    this.router.navigate(['/cashier-checkout']);
  }
}