import { FoodService } from './../../../core/service/foodService';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DrinkService } from '../../../core/service/DrinkService';
import { FishesService } from '../../../core/service/FishesService';
import { SaleDataService } from '../../../core/service/SaleDataService';
import { Drinkinterface } from '../../../core/interface/drink';
import { foodInterface } from '../../../core/interface/foodInterface';
import { Fish } from '../../../core/interface/Fish';
import { MeseroService } from '../../../core/service/WaiterService';
import { MeseroInterface } from '../../../core/interface/waiter';

interface CartItem {
  product: any;
  quantity: number;
  selectedSize?: {
    nombre: string;
    precio: number;
  };
}

@Component({
  selector: 'app-up-sales-amd',
  imports: [CommonModule, FormsModule],
  templateUrl: './up-sales-amd.html',
  styleUrl: './up-sales-amd.css'
})
export class UpSalesAmd implements OnInit {
  // Sale data
  selectedTable: string = '';
  selectedWaiter: string = '';
  selectedCategory: string = 'food';
  orderType: string = 'eat_in';
  
  // Catalogs
  drinks: Drinkinterface[] = [];
  foods: foodInterface[] = [];
  fishes: Fish[] = [];
  filteredProducts: any[] = [];
  
  // Cart
  cart: CartItem[] = [];
  
  // Modal variables
  showProductModal: boolean = false;
  selectedProduct: any = null;
  selectedSize: any = null;
  modalQuantity: number = 1;
  
  // Static lists
  tables: string[] = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6'];
  
  // Lista de meseros reales
  waiters: MeseroInterface[] = [];
  loadingWaiters: boolean = true;

  constructor(
    private drinkService: DrinkService,
    private foodService: FoodService,
    private fishesService: FishesService,
    private saleDataService: SaleDataService,
    private meseroService: MeseroService,
    private router: Router
  ) {}

  ngOnInit() {
    // Cargar meseros
    this.loadWaiters();
    
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
        precio: f.precio,
        tiene_tamanos: (f as any).tiene_tamanos,
        tamanos: (f as any).tamanos
      })));
      this.foods = foods;
      this.updateFilteredProducts();
    });
    
    // Load fishes
    this.fishesService.saucer$.subscribe(fishes => {
      console.log('🐟 PESCADOS DETALLADOS:', fishes.map(f => ({
        id: f.id, 
        nombre: f.nombre,
        precio: f.precio,
        tiene_tamanos: f.tiene_tamanos,
        tamanos: f.tamanos
      })));
      this.fishes = fishes;
      this.updateFilteredProducts();
    });
  }

  // Cargar meseros desde el servicio
  loadWaiters() {
    this.loadingWaiters = true;
    this.meseroService.cargarMeseros().subscribe({
      next: (meseros: MeseroInterface[]) => {
        this.waiters = meseros.filter(mesero => mesero.activo);
        this.loadingWaiters = false;
        console.log('👥 Meseros cargados:', this.waiters.length);
      },
      error: (error) => {
        console.error('Error cargando meseros:', error);
        this.loadingWaiters = false;
        this.waiters = [];
      }
    });
  }

  // Obtener texto del tipo de pedido
  getOrderTypeText(): string {
    return this.orderType === 'eat_in' ? '🍽️ Comer aquí' : '🥡 Para llevar';
  }

  // Obtener nombre completo del mesero seleccionado
  getSelectedWaiterName(): string {
    if (!this.selectedWaiter) return 'Mesero no seleccionado';
    
    const mesero = this.waiters.find(m => m.id?.toString() === this.selectedWaiter);
    return mesero ? `${mesero.nombre} ${mesero.apellido}` : 'Mesero no encontrado';
  }

  // MÉTODOS DEL MODAL
  openProductModal(product: any) {
    this.selectedProduct = product;
    this.selectedSize = null;
    this.modalQuantity = 1;
    
    const productType = this.getProductType(product);
    
    if ((productType === 'food' || productType === 'fish') && 
        product.tiene_tamanos && 
        product.tamanos && 
        product.tamanos.length > 0) {
      this.selectedSize = product.tamanos[0];
    }
    
    this.showProductModal = true;
  }

  closeProductModal() {
    this.showProductModal = false;
    this.selectedProduct = null;
    this.selectedSize = null;
    this.modalQuantity = 1;
  }

  selectSize(tamano: any) {
    this.selectedSize = tamano;
  }

  incrementModalQuantity() {
    this.modalQuantity++;
  }

  decrementModalQuantity() {
    if (this.modalQuantity > 1) {
      this.modalQuantity--;
    }
  }

  getCurrentPrice(): number {
    if (this.selectedSize) {
      return this.selectedSize.precio;
    }
    return this.selectedProduct?.precio || 0;
  }

  getMinPrice(tamanos: any[]): number {
    if (!tamanos || tamanos.length === 0) return 0;
    return Math.min(...tamanos.map((t: any) => t.precio));
  }

  private getProductType(product: any): string {
    if (this.drinks.some(d => d.id === product.id && d.nombre === product.nombre)) {
      return 'drink';
    } else if (this.foods.some(f => f.id === product.id && f.nombre === product.nombre)) {
      return 'food';
    } else if (this.fishes.some(f => f.id === product.id && f.nombre === product.nombre)) {
      return 'fish';
    }
    return 'unknown';
  }

  addToCartWithOptions() {
    if (!this.selectedProduct) return;

    const productType = this.getProductType(this.selectedProduct);
    
    if ((productType === 'food' || productType === 'fish') && 
        this.selectedProduct.tiene_tamanos && 
        !this.selectedSize) {
      alert('Por favor selecciona un tamaño');
      return;
    }

    const productToAdd = {
      ...this.selectedProduct,
      precio: this.selectedSize ? this.selectedSize.precio : this.selectedProduct.precio
    };

    const sizeId = ((productType === 'food' || productType === 'fish') && this.selectedSize) ? 
                   `_${this.selectedSize.nombre}` : '';
    const uniqueId = `${productType}_${this.selectedProduct.id}_${this.selectedProduct.nombre}${sizeId}`;
    
    console.log('🎯 PRODUCTO CON TAMAÑO:', {
      nombre: this.selectedProduct.nombre,
      tipo: productType,
      tamaño: this.selectedSize?.nombre,
      precio: this.getCurrentPrice(),
      cantidad: this.modalQuantity,
      idUnico: uniqueId
    });
    
    const existingItem = this.cart.find(item => {
      const itemType = this.getProductType(item.product);
      const itemSizeId = ((itemType === 'food' || itemType === 'fish') && item.selectedSize) ? 
                         `_${item.selectedSize.nombre}` : '';
      const itemUniqueId = `${itemType}_${item.product.id}_${item.product.nombre}${itemSizeId}`;
      return itemUniqueId === uniqueId;
    });
    
    if (existingItem) {
      existingItem.quantity += this.modalQuantity;
    } else {
      this.cart.push({
        product: productToAdd,
        quantity: this.modalQuantity,
        selectedSize: ((productType === 'food' || productType === 'fish') && this.selectedSize) ? {
          nombre: this.selectedSize.nombre,
          precio: this.selectedSize.precio
        } : undefined
      });
    }
    
    this.closeProductModal();
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
    this.openProductModal(product);
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
      const price = item.selectedSize?.precio || item.product.precio;
      return total + (price * item.quantity);
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

    // Obtener nombre completo del mesero seleccionado
    const meseroSeleccionado = this.waiters.find(m => m.id?.toString() === this.selectedWaiter);
    const nombreMesero = meseroSeleccionado ? 
      `${meseroSeleccionado.nombre} ${meseroSeleccionado.apellido}` : 
      this.selectedWaiter || 'No asignado';

    const saleData = {
      table: this.selectedTable,
      waiter: nombreMesero,
      products: [...this.cart],
      total: this.calculateTotal(),
      date: new Date(),
      orderType: this.orderType
    };

    this.saleDataService.setSaleData(saleData);
    this.router.navigate(['/cashier-checkout']);
  }

  productHasSizes(product: any): boolean {
    const productType = this.getProductType(product);
    return (productType === 'food' || productType === 'fish') && 
           product.tiene_tamanos && 
           product.tamanos;
  }

  getProductSizes(product: any): any[] {
    const productType = this.getProductType(product);
    if ((productType === 'food' || productType === 'fish') && product.tamanos) {
      return product.tamanos;
    }
    return [];
  }
}