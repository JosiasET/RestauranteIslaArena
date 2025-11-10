import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SaleDataService } from '../../core/service/SaleDataService';
import { TrackingService } from '../../core/service/tracking.service';

interface SaleData {
  table: string;
  waiter: string;
  products: any[];
  total: number;
  date: Date;
  orderType: string;
}

@Component({
  selector: 'app-cashier-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, RouterLink],
  templateUrl: './cashier-checkout.html',
  styleUrl: './cashier-checkout.css'
})
export class CashierCheckout implements OnInit {
  saleData: SaleData | null = null;
  
  // Customer information
  customerName: string = '';
  customerPhone: string = '';
  
  // Payment information
  paymentMethod: string = 'cash';
  amountReceived: number = 0;
  cardLastDigits: string = '';
  transferReference: string = '';

  constructor(
    private router: Router,
    private saleDataService: SaleDataService,
    private trackingService: TrackingService
  ) {}

  ngOnInit() {
    // Get sale data from service
    this.saleData = this.saleDataService.getSaleData();
    
    // If no data, redirect back
    if (!this.saleData) {
      this.goBack();
    }
  }

  getOrderTypeText(): string {
    if (!this.saleData) return '';
    return this.saleData.orderType === 'eat_in' ? '🍽️ Comer aquí' : '🥡 Para llevar';
  }

  selectPaymentMethod(method: string) {
    this.paymentMethod = method;
    this.amountReceived = 0;
    this.cardLastDigits = '';
    this.transferReference = '';
  }

  calculateChange(): number {
    if (!this.saleData || this.amountReceived <= 0) return 0;
    return this.amountReceived - this.saleData.total;
  }

  canConfirmPayment(): boolean {
    if (!this.saleData) return false;

    switch (this.paymentMethod) {
      case 'cash':
        return this.amountReceived >= this.saleData.total;
      case 'card':
        return this.cardLastDigits.length === 4;
      case 'transfer':
        return this.transferReference.length > 0;
      default:
        return false;
    }
  }

  confirmPayment() {
    if (!this.canConfirmPayment() || !this.saleData) return;

    // Guardar saleData en variable local para usar en el callback
    const currentSaleData = this.saleData;
    const trackingCode = this.generateTrackingCode();
    
    const orderData = {
      tracking_code: trackingCode,
      customer_name: this.customerName || `Cliente Mesa ${currentSaleData.table}`,
      customer_phone: this.customerPhone || '',
      order_items: currentSaleData.products.map(item => ({
        nombre: item.product.nombre,
        cantidad: item.quantity,
        precio: item.selectedSize?.precio || item.product.precio,
        tamaño: item.selectedSize?.nombre || 'Único'
      })),
      total_amount: currentSaleData.total,
      status: 'pedido_recibido',
      payment_verified: true,
      payment_method: this.getPaymentMethodForDB(),
      payment_reference: this.getPaymentReference(),
      delivery_address: currentSaleData.orderType === 'eat_in' ? {
        address: `Mesa ${currentSaleData.table} - ${currentSaleData.waiter}`,
        references: `Pedido ${currentSaleData.orderType === 'eat_in' ? 'en restaurante' : 'para llevar'}`
      } : null,
      order_type: currentSaleData.orderType
    };

    console.log('💾 Guardando pedido en BD:', orderData);

    this.trackingService.createOrder(orderData).subscribe({
      next: (savedOrder: any) => {
        console.log('✅ Pedido guardado en BD:', savedOrder);
        
        const paymentRecord = {
          saleData: currentSaleData,
          customerInfo: {
            name: this.customerName,
            phone: this.customerPhone
          },
          paymentInfo: {
            method: this.paymentMethod,
            amountReceived: this.amountReceived,
            change: this.calculateChange(),
            cardLastDigits: this.cardLastDigits,
            transferReference: this.transferReference,
            timestamp: new Date()
          },
          trackingCode: trackingCode
        };

        console.log('Payment processed:', paymentRecord);

        const formattedTotal = new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN'
        }).format(currentSaleData.total);

        // Show success message
        alert(`✅ Pago procesado exitosamente!\nTotal: ${formattedTotal}\nMesa: ${currentSaleData.table}\nMesero: ${currentSaleData.waiter}\nCódigo: ${trackingCode}`);
        
        this.saleDataService.clearSaleData();
        
        setTimeout(() => {
          this.router.navigate(['/gestoramd/tracking']);
        }, 500);
      },
      error: (error: any) => {
        console.error('❌ Error guardando pedido en BD:', error);
        alert('✅ Pago procesado pero hubo un error al guardar en el sistema. Contacte al administrador.');
        
        this.saleDataService.clearSaleData();
        setTimeout(() => {
          this.router.navigate(['/gestoramd/tracking']);
        }, 500);
      }
    });
  }

  private generateTrackingCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'REST-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private getPaymentMethodForDB(): string {
    const methodMap: { [key: string]: string } = {
      'cash': 'efectivo',
      'card': 'tarjeta', 
      'transfer': 'transferencia'
    };
    return methodMap[this.paymentMethod] || this.paymentMethod;
  }

  private getPaymentReference(): string {
    switch (this.paymentMethod) {
      case 'cash':
        return `Efectivo - Cambio: ${this.calculateChange()}`;
      case 'card':
        return `Tarjeta - Últimos 4: ${this.cardLastDigits}`;
      case 'transfer':
        return `Transferencia - Ref: ${this.transferReference}`;
      default:
        return '';
    }
  }

  goBack() {
    this.router.navigate(['/gestoramd/upsales']);
  }
}