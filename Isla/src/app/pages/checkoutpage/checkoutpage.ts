import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../core/interface/cart.services';

@Component({
  selector: 'app-checkoutpage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkoutpage.html',
  styleUrls: ['./checkoutpage.css']
})
export class Checkoutpage implements OnInit {
  customerData = {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    address: '',
    neighborhood: '',
    postalCode: '',
    city: '',
    state: 'Campeche',
    references: '',
    saveInfo: false
  };

  cartItems: CartItem[] = [];
  total: number = 0;
  isSubmitting: boolean = false;
  paymentMethod: string = '';
  cashAmount: number = 0;
  transferReference: string = '';

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cartItems = this.cartService.getCartItems();
    this.total = this.cartService.getTotal();
  }

  selectPaymentMethod(method: string) {
    this.paymentMethod = method;
    if (method !== 'efectivo') {
      this.cashAmount = 0;
    }
    if (method !== 'transferencia') {
      this.transferReference = '';
    }
  }

  placeOrder() {
    if (!this.isFormValid()) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!this.isPaymentValid()) {
      alert('Por favor completa la información de pago');
      return;
    }

    this.isSubmitting = true;

    setTimeout(() => {
      console.log('Datos del pedido:', {
        customer: this.customerData,
        payment: this.paymentMethod,
        cashAmount: this.cashAmount,
        transferReference: this.transferReference,
        cart: this.cartItems,
        total: this.total
      });
      
      // 1. Limpiar el carrito
      this.cartService.clearCart();
      
      // 2. Mostrar confirmación
      alert(`¡Pedido realizado con éxito! Método de pago: ${this.getPaymentMethodText()}`);
      
      // 3. Redirigir a home
      this.router.navigate(['/Home']);
      
      this.isSubmitting = false;
    }, 1000);
  }

  // Validar formulario
  isFormValid(): boolean {
    const requiredFields = [
      this.customerData.firstName,
      this.customerData.lastName,
      this.customerData.phoneNumber,
      this.customerData.address,
      this.customerData.neighborhood,
      this.customerData.postalCode,
      this.customerData.city
    ];

    return requiredFields.every(field => field && field.trim() !== '');
  }

  // Validar método de pago - CORREGIDO
  isPaymentValid(): boolean {
    if (!this.paymentMethod) return false;
    
    if (this.paymentMethod === 'efectivo') {
      return this.cashAmount > 0 && this.cashAmount >= this.total;
    }
    
    if (this.paymentMethod === 'transferencia') {
      return !!this.transferReference && this.transferReference.trim() !== ''; // ← CORREGIDO
    }
    
    return true; // Para tarjeta, solo necesita estar seleccionada
  }

  getPaymentMethodText(): string {
    const methods = {
      'transferencia': `Transferencia (Folio: ${this.transferReference})`,
      'tarjeta': 'Tarjeta (En tienda)',
      'efectivo': `Efectivo ($${this.cashAmount})`
    };
    return methods[this.paymentMethod as keyof typeof methods] || '';
  }

  // Verificar si hay productos en el carrito
  hasItems(): boolean {
    return this.cartItems.length > 0;
  }
}