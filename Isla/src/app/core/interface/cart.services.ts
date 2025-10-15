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
    const existingItem = this.cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.cantidad += 1;
    } else {
      this.cartItems.push({...product, cantidad: 1});
    }
    this.updateCart();
    this.openCart(); // ← ABRE EL CARRITO AUTOMÁTICAMENTE
    console.log('Producto agregado al carrito:', product.nombre);
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
      console.log('Carrito cargado desde localStorage:', this.cartItems);
    }
  }

  removeFromCart(itemId: number) {
    this.cartItems = this.cartItems.filter(item => item.id !== itemId);
    this.updateCart();
    console.log('Producto eliminado del carrito');
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
}