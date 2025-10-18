import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  private cartVisible = new BehaviorSubject<boolean>(false);
  
  cart$ = this.cartSubject.asObservable();
  cartVisible$ = this.cartVisible.asObservable();

  constructor() {
    this.loadCartFromStorage();
  }

  addToCart(product: CartItem) {
    console.log('=== 🚨 DEBUG CART SERVICE ===');
    console.log('📦 Producto recibido:', {
      id: product.id,
      nombre: product.nombre,
      tipoId: typeof product.id
    });
    
    console.log('🛒 Carrito ANTES:', this.cartItems.map(item => ({
      id: item.id, 
      nombre: item.nombre, 
      cantidad: item.cantidad
    })));

    const existingItem = this.cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.cantidad += 1;
      console.log('✅ EXISTE - Cantidad incrementada:', existingItem.nombre, 'x', existingItem.cantidad);
    } else {
      this.cartItems.push({...product, cantidad: 1});
      console.log('🆕 NUEVO - Producto agregado:', product.nombre);
    }
    
    this.updateCart();
    this.openCart();
    
    console.log('🛒 Carrito DESPUÉS:', this.cartItems.map(item => ({
      id: item.id, 
      nombre: item.nombre, 
      cantidad: item.cantidad
    })));
    console.log('=== 🚨 FIN DEBUG ===');
  }

  getCartItems(): CartItem[] {
    return [...this.cartItems];
  }

  clearCart() {
    this.cartItems = [];
    this.updateCart();
  }

  getTotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }

  private updateCart() {
    this.cartSubject.next(this.cartItems);
    localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
  }

  private loadCartFromStorage() {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      this.cartItems = JSON.parse(savedCart);
      this.cartSubject.next(this.cartItems);
    }
  }

  removeFromCart(itemId: number) {
    this.cartItems = this.cartItems.filter(item => item.id !== itemId);
    this.updateCart();
  }

  // MÉTODOS DEL DRAWER
  toggleCart(): void {
    this.cartVisible.next(!this.cartVisible.value);
  }

  openCart(): void {
    this.cartVisible.next(true);
  }

  closeCart(): void {
    this.cartVisible.next(false);
  }

  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.cantidad, 0);
  }

  // MÉTODO DE EMERGENCIA: Forzar unificación por nombre
  forceMergeByName() {
    console.log('🔄 Forzando unificación por nombre...');
    
    const mergedItems: CartItem[] = [];
    const seenNames = new Map<string, CartItem>();
    
    this.cartItems.forEach(item => {
      const normalizedName = item.nombre.toLowerCase().trim();
      
      if (seenNames.has(normalizedName)) {
        // Producto duplicado - sumar cantidades
        const existingItem = seenNames.get(normalizedName)!;
        existingItem.cantidad += item.cantidad;
        console.log('🔀 Unificado:', existingItem.nombre, 'cantidad:', existingItem.cantidad);
      } else {
        // Producto nuevo - agregar
        const newItem = {...item};
        mergedItems.push(newItem);
        seenNames.set(normalizedName, newItem);
      }
    });
    
    this.cartItems = mergedItems;
    this.updateCart();
    console.log('✅ Unificación completada');
  }
}