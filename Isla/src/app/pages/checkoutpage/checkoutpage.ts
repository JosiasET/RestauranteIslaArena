import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService, CartItem } from '../../core/interface/cart.services';
import { TrackingService } from '../../core/service/tracking.service';

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
  trackingCode: string = '';

  constructor(
    private cartService: CartService,
    private router: Router,
    private http: HttpClient,
    private trackingService: TrackingService
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

  generateTrackingCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'MS-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
    this.trackingCode = this.generateTrackingCode();
    
    // ✅ NUEVO: Preparar datos para las 3 tablas
    const orderPayload = {
      // Datos para USERS
      user_data: {
        first_name: this.customerData.firstName,
        last_name: this.customerData.lastName,
        phone: this.customerData.phoneNumber,
        email: this.customerData.email || '',
        user_type: 'customer'
      },
      
      // Datos para CUSTOMERS
      customer_data: {
        address: this.customerData.address,
        city: this.customerData.city,
        state: this.customerData.state,
        postal_code: this.customerData.postalCode,
        extra_references: this.customerData.references
      },
      
      // Datos para ORDER_TRACKING
      order_data: {
        tracking_code: this.trackingCode,
        order_items: this.cartItems,
        total_amount: this.total,
        status: 'pedido_recibido',
        payment_verified: false,
        payment_method: this.paymentMethod,
        payment_reference: this.transferReference,
        delivery_address: {
          address: this.customerData.address,
          neighborhood: this.customerData.neighborhood,
          postal_code: this.customerData.postalCode,
          city: this.customerData.city,
          state: this.customerData.state,
          references: this.customerData.references,
          cashAmount: this.paymentMethod === 'efectivo' ? this.cashAmount : null
        }
      }
    };

    console.log('Enviando pedido completo...');

    // ✅ NUEVO: Usar el nuevo servicio que maneja las 3 tablas
    this.trackingService.createCompleteOrder(orderPayload).subscribe({
      next: (response: any) => {
        console.log('Pedido completo guardado:', response);
        
        this.cartService.clearCart();
        
        const mensaje = navigator.onLine 
          ? `¡Pedido realizado con éxito! Tu código de seguimiento es: ${this.trackingCode}`
          : `¡Pedido guardado localmente! Código temporal: ${this.trackingCode}. Se subirá automáticamente cuando recuperes internet.`;
        
        alert(mensaje);
        this.router.navigate(['/Home']);
      },
      error: (error: any) => {
        console.error('Error al procesar el pedido:', error);
        alert('Error al procesar el pedido. Por favor intenta nuevamente.');
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  // ... (el resto de los métodos se mantienen igual)
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

  isPaymentValid(): boolean {
    if (!this.paymentMethod) return false;
    if (this.paymentMethod === 'efectivo') {
      return this.cashAmount > 0 && this.cashAmount >= this.total;
    }
    if (this.paymentMethod === 'transferencia') {
      return !!this.transferReference && this.transferReference.trim() !== '';
    }
    return true;
  }

  getPaymentMethodText(): string {
    const methods = {
      'transferencia': `Transferencia (Folio: ${this.transferReference})`,
      'tarjeta': 'Tarjeta (En tienda)',
      'efectivo': `Efectivo ($${this.cashAmount})`
    };
    return methods[this.paymentMethod as keyof typeof methods] || '';
  }

  hasItems(): boolean {
    return this.cartItems.length > 0;
  }
}