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
  waiters: string[] = ['Mesero 1', 'Mesero 2'];

  constructor(
    private drinkService: DrinkService,
    private foodService: FoodService,
    private fishesService: FishesService,
    private saleDataService: SaleDataService,
    private router: Router
  ) {}

  ngOnInit() {
    // Load drinks (sin tamaños por ahora)
    this.drinkService.saucer$.subscribe(drinks => {
      console.log('🥤 BEBIDAS DETALLADAS:', drinks.map(d => ({
        id: d.id, 
        nombre: d.nombre,
        precio: d.precio
        // tiene_tamanos y tamanos comentados por ahora
      })));
      this.drinks = drinks;
      this.updateFilteredProducts();
    });
    
    // Load foods (CON TAMAÑOS - este sí funciona)
    this.foodService.saucer$.subscribe(foods => {
      console.log('🍽️ COMIDAS DETALLADAS:', foods.map(f => ({
        id: f.id, 
        nombre: f.nombre, 
        precio: f.precio,
        tiene_tamanos: (f as any).tiene_tamanos, // Usamos 'as any' para evitar errores TypeScript
        tamanos: (f as any).tamanos
      })));
      this.foods = foods;
      this.updateFilteredProducts();
    });
    
    // Load fishes (sin tamaños por ahora)
    this.fishesService.saucer$.subscribe(fishes => {
      console.log('🐟 PESCADOS DETALLADOS:', fishes.map(f => ({
        id: f.id, 
        nombre: f.nombre,
        precio: f.precio
        // tiene_tamanos y tamanos comentados por ahora
      })));
      this.fishes = fishes;
      this.updateFilteredProducts();
    });
  }

  // MÉTODOS DEL MODAL
  openProductModal(product: any) {
    this.selectedProduct = product;
    this.selectedSize = null;
    this.modalQuantity = 1;
    
    // Solo aplicar tamaños a food (por ahora)
    const productType = this.getProductType(product);
    
    if (productType === 'food' && (product as any).tiene_tamanos && (product as any).tamanos && (product as any).tamanos.length > 0) {
      this.selectedSize = (product as any).tamanos[0];
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

  // Método auxiliar para determinar el tipo de producto
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

    // Validar tamaños solo para food
    const productType = this.getProductType(this.selectedProduct);
    
    if (productType === 'food' && (this.selectedProduct as any).tiene_tamanos && !this.selectedSize) {
      alert('Por favor selecciona un tamaño');
      return;
    }

    const productToAdd = {
      ...this.selectedProduct,
      // Si tiene tamaño seleccionado, usar ese precio
      precio: this.selectedSize ? this.selectedSize.precio : this.selectedProduct.precio
    };

    // Crear ID único incluyendo el tamaño (solo para food)
    const sizeId = (productType === 'food' && this.selectedSize) ? `_${this.selectedSize.nombre}` : '';
    const uniqueId = `${productType}_${this.selectedProduct.id}_${this.selectedProduct.nombre}${sizeId}`;
    
    console.log('🎯 PRODUCTO CON TAMAÑO:', {
      nombre: this.selectedProduct.nombre,
      tipo: productType,
      tamaño: this.selectedSize?.nombre,
      precio: this.getCurrentPrice(),
      cantidad: this.modalQuantity,
      idUnico: uniqueId
    });
    
    // Buscar por ID único
    const existingItem = this.cart.find(item => {
      const itemType = this.getProductType(item.product);
      const itemSizeId = (itemType === 'food' && item.selectedSize) ? `_${item.selectedSize.nombre}` : '';
      const itemUniqueId = `${itemType}_${item.product.id}_${item.product.nombre}${itemSizeId}`;
      return itemUniqueId === uniqueId;
    });
    
    if (existingItem) {
      existingItem.quantity += this.modalQuantity;
    } else {
      this.cart.push({
        product: productToAdd,
        quantity: this.modalQuantity,
        // Solo guardar tamaño para food
        selectedSize: (productType === 'food' && this.selectedSize) ? {
          nombre: this.selectedSize.nombre,
          precio: this.selectedSize.precio
        } : undefined
      });
    }
    
    this.closeProductModal();
  }

  // MÉTODOS EXISTENTES
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

  // Este método ya no se usa directamente, se reemplaza por el modal
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

  // Método para verificar si un producto tiene tamaños (solo para food)
  productHasSizes(product: any): boolean {
    const productType = this.getProductType(product);
    return productType === 'food' && (product as any).tiene_tamanos && (product as any).tamanos;
  }

  // Método para obtener tamaños (solo para food)
  getProductSizes(product: any): any[] {
    const productType = this.getProductType(product);
    if (productType === 'food' && (product as any).tamanos) {
      return (product as any).tamanos;
    }
    return [];
  }
}