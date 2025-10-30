import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { TrackingService, OrderTracking } from '../../../core/service/tracking.service';
@Component({
  selector: 'app-seguimiento-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './seguimiento-pedidos.html',
  styleUrl: './seguimiento-pedidos.css'
})
export class SeguimientoPedidosComponent {
  trackingCode: string = '';
  order: OrderTracking | null = null;
  loading: boolean = false;
  error: string = '';

  constructor(
    private trackingService: TrackingService,
    private cdRef: ChangeDetectorRef
  ) {}

  searchOrder() {
    if (!this.trackingCode.trim()) {
      alert('Por favor ingresa un código de seguimiento');
      return;
    }

    console.log('🔍 Iniciando búsqueda...');
    
    this.loading = true;
    this.error = '';
    this.order = null;
    
    // Forzar actualización INMEDIATA de la vista
    this.cdRef.detectChanges();

    this.trackingService.getOrderByCode(this.trackingCode).subscribe({
      next: (order: OrderTracking) => {
        console.log('✅ Pedido encontrado:', order);
        this.order = order;
        this.loading = false;
        this.cdRef.detectChanges(); // Actualizar vista después de recibir datos
      },
      error: (err: any) => {
        console.error('❌ Error:', err);
        this.error = 'Pedido no encontrado. Verifica tu código.';
        this.loading = false;
        this.cdRef.detectChanges(); // Actualizar vista después del error
      }
    });
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pedido_recibido': 'Pedido Recibido',
      'pago_verificado': 'Pago Verificado',
      'en_preparacion': 'En Preparación',
      'en_camino': 'En Camino',
      'entregado': 'Entregado',
      'finalizado': 'Finalizado'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    if (!this.order) return 'status-pending';
    
    const statusOrder = [
      'pedido_recibido',
      'pago_verificado', 
      'en_preparacion',
      'en_camino',
      'entregado'
    ];
    
    const currentIndex = statusOrder.indexOf(this.order.status);
    const targetIndex = statusOrder.indexOf(status);
    
    if (targetIndex < currentIndex) return 'status-completed';
    if (targetIndex === currentIndex) return 'status-active';
    return 'status-pending';
  }
  getPaymentMethodText(method: string): string {
  const methods: { [key: string]: string } = {
    'transferencia': '🏦 Transferencia Bancaria',
    'efectivo': '💵 Efectivo'
  };
  return methods[method] || method;
}
}

//
