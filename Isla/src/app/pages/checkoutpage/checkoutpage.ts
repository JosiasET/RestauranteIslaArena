import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
  trackingCode: string = ''; // ← NUEVO: Para guardar el código generado

  constructor(
    private cartService: CartService,
    private router: Router,
    private http: HttpClient // ← AGREGAR HttpClient
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

  // GENERAR CÓDIGO ALEATORIO
  generateTrackingCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'MS-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async placeOrder() {
    if (!this.isFormValid()) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!this.isPaymentValid()) {
      alert('Por favor completa la información de pago');
      return;
    }

    this.isSubmitting = true;

    try {
      // 1. Generar código de seguimiento
      this.trackingCode = this.generateTrackingCode();
      
        const orderData = {
          tracking_code: this.trackingCode,
          customer_name: `${this.customerData.firstName} ${this.customerData.lastName}`,
          customer_phone: this.customerData.phoneNumber,
          customer_email: this.customerData.email || '',
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
            // ✅ AGREGAR cashAmount aquí
            cashAmount: this.paymentMethod === 'efectivo' ? this.cashAmount : null
          }
        };

      console.log('Enviando pedido a la base de datos:', orderData);

      // 3. Guardar en la base de datos
      const response: any = await this.http.post('http://localhost:3000/tracking', orderData).toPromise();
      
      console.log('Pedido guardado en BD:', response);

      // 4. Limpiar el carrito
      this.cartService.clearCart();
      
      // 5. Mostrar confirmación con código de seguimiento
      alert(`¡Pedido realizado con éxito! 
      
Tu código de seguimiento es: ${this.trackingCode}

Guarda este código para rastrear tu pedido.`);

      // 6. Redirigir a home
      this.router.navigate(['/Home']);
      
    } catch (error) {
      console.error('Error al guardar el pedido:', error);
      alert('Error al procesar el pedido. Por favor intenta nuevamente.');
    } finally {
      this.isSubmitting = false;
    }
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

  // Validar método de pago
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

  // Verificar si hay productos en el carrito
  hasItems(): boolean {
    return this.cartItems.length > 0;
  }
}