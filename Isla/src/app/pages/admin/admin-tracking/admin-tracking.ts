import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrackingService, OrderTracking } from '../../../core/service/tracking.service';

@Component({
  selector: 'app-admin-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-tracking.html',
  styleUrls: ['./admin-tracking.css']
})
export class AdminTrackingComponent implements OnInit {
  orders: OrderTracking[] = [];
  filteredOrders: OrderTracking[] = [];
  loading: boolean = false;
  searchTerm: string = '';
  selectedOrder: OrderTracking | null = null;
  currentFilter: string = '';

  // Estadísticas
  stats = {
    total: 0,
    pendientes: 0,
    en_proceso: 0,
    entregados: 0
  };

  // Opciones de estado para los botones - CORREGIDO
  statusOptions = [
    { value: 'pedido_recibido', label: 'Recibido', icon: '📥' },
    { value: 'pago_verificado', label: 'Pago Verificado', icon: '💳' },
    { value: 'en_preparacion', label: 'En Preparación', icon: '👨‍🍳' },
    { value: 'en_camino', label: 'En Camino', icon: '🚚' },
    { value: 'entregado', label: 'Entregado', icon: '✅' },
    { value: 'finalizado', label: 'Finalizado', icon: '🏁' }
  ];

  constructor(private trackingService: TrackingService) {}

  ngOnInit() {
    console.log('✅ AdminTrackingComponent inicializado');
    this.loadOrders();
  }

  loadOrders() {
    console.log('🔄 Cargando pedidos...');
    this.loading = true;
    this.trackingService.getAllOrders().subscribe({
      next: (orders: OrderTracking[]) => {
        console.log('📦 Pedidos cargados:', orders.length);
        this.orders = orders;
        this.filteredOrders = orders;
        this.calculateStats();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('❌ Error loading orders:', error);
        this.loading = false;
        alert('Error al cargar los pedidos');
      }
    });
  }

  calculateStats() {
    this.stats.total = this.orders.length;
    this.stats.pendientes = this.orders.filter(order => 
      order.status === 'pedido_recibido' || order.status === 'pago_verificado'
    ).length;
    this.stats.en_proceso = this.orders.filter(order => 
      order.status === 'en_preparacion' || order.status === 'en_camino'
    ).length;
    this.stats.entregados = this.orders.filter(order => 
      order.status === 'entregado' || order.status === 'finalizado'
    ).length;
  }

  filterOrders() {
    if (!this.searchTerm) {
      this.applyCurrentFilter();
      return;
    }

    const term = this.searchTerm.toLowerCase();
    let filtered = this.orders.filter(order =>
      order.tracking_code.toLowerCase().includes(term) ||
      order.customer_name.toLowerCase().includes(term) ||
      (order.customer_phone && order.customer_phone.includes(term))
    );

    // Aplicar filtro actual si existe
    if (this.currentFilter) {
      filtered = this.applyStatusFilter(filtered, this.currentFilter);
    }

    this.filteredOrders = filtered;
  }

  filterByStatus(filter: string) {
    this.currentFilter = filter;
    this.applyCurrentFilter();
  }

  applyCurrentFilter() {
    if (!this.currentFilter) {
      this.filteredOrders = this.orders;
      return;
    }

    this.filteredOrders = this.applyStatusFilter(this.orders, this.currentFilter);
  }

  applyStatusFilter(orders: OrderTracking[], filter: string): OrderTracking[] {
    switch (filter) {
      case 'pendientes':
        return orders.filter(order => 
          order.status === 'pedido_recibido' || order.status === 'pago_verificado'
        );
      case 'en_proceso':
        return orders.filter(order => 
          order.status === 'en_preparacion' || order.status === 'en_camino'
        );
      case 'entregados':
        return orders.filter(order => 
          order.status === 'entregado' || order.status === 'finalizado'
        );
      default:
        return orders;
    }
  }

  openOrderDetails(order: OrderTracking) {
    this.selectedOrder = order;
    console.log('📋 Abriendo detalles del pedido:', order.tracking_code);
  }

  closeOrderDetails() {
    this.selectedOrder = null;
  }

  updateOrderStatus(order: OrderTracking, newStatus: string) {
    console.log('🔄 Actualizando estado:', order.tracking_code, '->', newStatus);
    
    this.trackingService.updateOrderStatus(order.id!, newStatus, order.payment_verified).subscribe({
      next: (updatedOrder: OrderTracking) => {
        console.log('✅ Estado actualizado:', updatedOrder);
        
        // Actualizar el pedido en la lista
        const index = this.orders.findIndex(o => o.id === order.id);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
          this.filterOrders();
          this.calculateStats();
        }

        // Si el pedido seleccionado es el mismo, actualizarlo también
        if (this.selectedOrder && this.selectedOrder.id === order.id) {
          this.selectedOrder = updatedOrder;
        }

        // Mostrar notificación
        this.showNotification(`Estado actualizado a: ${this.getStatusText(newStatus)}`);
      },
      error: (error: any) => {
        console.error('❌ Error updating order:', error);
        alert('Error al actualizar el estado del pedido');
      }
    });
  }

  togglePaymentStatus(order: OrderTracking) {
    const newPaymentStatus = !order.payment_verified;
    console.log('💳 Actualizando pago:', order.tracking_code, '->', newPaymentStatus);
    
    this.trackingService.updatePaymentStatus(order.id!, newPaymentStatus).subscribe({
      next: (updatedOrder: OrderTracking) => {
        console.log('✅ Pago actualizado:', updatedOrder);
        
        // Actualizar el pedido en la lista
        const index = this.orders.findIndex(o => o.id === order.id);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
          this.filterOrders();
        }

        // Si el pedido seleccionado es el mismo, actualizarlo también
        if (this.selectedOrder && this.selectedOrder.id === order.id) {
          this.selectedOrder = updatedOrder;
        }

        // Mostrar notificación
        this.showNotification(`Pago ${newPaymentStatus ? 'verificado' : 'marcado como pendiente'}`);
      },
      error: (error: any) => {
        console.error('❌ Error updating payment:', error);
        alert('Error al actualizar el estado del pago');
      }
    });
  }

  getOrderCardClass(order: OrderTracking): string {
    const statusClassMap: { [key: string]: string } = {
      'pedido_recibido': 'received',
      'pago_verificado': 'verified',
      'en_preparacion': 'preparing',
      'en_camino': 'shipping',
      'entregado': 'delivered',
      'finalizado': 'completed'
    };
    return statusClassMap[order.status] || '';
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pedido_recibido': 'status-badge-received',
      'pago_verificado': 'status-badge-verified',
      'en_preparacion': 'status-badge-preparing',
      'en_camino': 'status-badge-shipping',
      'entregado': 'status-badge-delivered',
      'finalizado': 'status-badge-completed'
    };
    return statusClasses[status] || 'status-badge-default';
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

  getPaymentMethodText(method: string | undefined): string {
    if (!method) return 'No especificado';
    
    const methods: { [key: string]: string } = {
      'transferencia': '🏦 Transferencia',
      'efectivo': '💵 Efectivo'
    };
    return methods[method] || method;
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} d`;
    
    return date.toLocaleDateString();
  }

  // ✅ MÉTODO PARA CALCULAR EL CAMBIO
  getChangeAmount(order: OrderTracking): number {
    if (order.payment_method === 'efectivo' && order.delivery_address?.cashAmount) {
      const cashAmount = order.delivery_address.cashAmount;
      const total = order.total_amount || 0;
      return cashAmount - total;
    }
    return 0;
  }

  showNotification(message: string) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 1001;
      font-weight: bold;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remover después de 3 segundos
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }
}