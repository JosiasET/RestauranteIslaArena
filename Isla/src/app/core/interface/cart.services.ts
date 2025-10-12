import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Interface local para el carrito
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
  
  cart$ = this.cartSubject.asObservable();

  constructor() {
    this.loadCartFromStorage();
  }

  // Agregar producto al carrito
  addToCart(product: CartItem) {
    const existingItem = this.cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      // Si ya existe, incrementar cantidad
      existingItem.cantidad += 1;
    } else {
      // Si no existe, agregar con cantidad 1
      this.cartItems.push({...product, cantidad: 1});
    }
    this.updateCart();
    console.log('Producto agregado al carrito:', product.nombre);
  }

  // Obtener items del carrito
  getCartItems(): CartItem[] {
    return [...this.cartItems];
  }

  // Limpiar carrito
  clearCart() {
    this.cartItems = [];
    this.updateCart();
  }

  // Calcular total
  getTotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }

  // Persistencia en localStorage
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
}