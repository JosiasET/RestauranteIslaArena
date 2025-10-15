import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SaleDataService } from '../../core/service/SaleDataService';

interface SaleData {
  table: string;
  waiter: string;
  products: any[];
  total: number;
  date: Date;
}

@Component({
  selector: 'app-cashier-checkout',
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
    private saleDataService: SaleDataService
  ) {}

  ngOnInit() {
    // Get sale data from service
    this.saleData = this.saleDataService.getSaleData();
    
    // If no data, redirect back
    if (!this.saleData) {
      this.goBack();
    }
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

    // Create payment record
    const paymentRecord = {
      saleData: this.saleData,
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
      }
    };

    // TODO: Save to database/service
    console.log('Payment processed:', paymentRecord);

    // Formatear el total para el alert
    const formattedTotal = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(this.saleData.total);

    // Show success message and redirect
    alert(`✅ Pago procesado exitosamente!\nTotal: ${formattedTotal}\nMesa: ${this.saleData.table}`);
    
    // Limpiar datos y redirigir
    this.saleDataService.clearSaleData();
    this.router.navigate(['/gestoramd/uventas']);
  }

  goBack() {
    this.router.navigate(['/gestoramd/uventas']);
  }
}