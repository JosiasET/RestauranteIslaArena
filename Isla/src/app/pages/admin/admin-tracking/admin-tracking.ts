import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TrackingService, OrderTracking } from '../../../core/service/tracking.service';

@Component({
  selector: 'app-admin-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-tracking.html',
  styleUrls: ['./admin-tracking.css']
})
export class AdminTrackingComponent implements OnInit, OnDestroy {
  orders: OrderTracking[] = [];
  filteredOrders: OrderTracking[] = [];
  completedOrders: OrderTracking[] = []; // ✅ NUEVO: Pedidos finalizados
  loading: boolean = true;
  searchTerm: string = '';
  selectedOrder: OrderTracking | null = null;
  currentFilter: string = '';

  // Estadísticas
 stats = {
    total: 0,
    pendientes: 0,
    en_proceso: 0,
    entregados: 0,
    finalizados: 0 // ✅ NUEVO
  };

  // Opciones de estado para los botones
  statusOptions = [
    { value: 'pedido_recibido', label: 'Recibido', icon: '📥' },
    { value: 'pago_verificado', label: 'Pago Verificado', icon: '💳' },
    { value: 'en_preparacion', label: 'En Preparación', icon: '👨‍🍳' },
    { value: 'en_camino', label: 'En Camino', icon: '🚚' },
    { value: 'entregado', label: 'Entregado', icon: '✅' },
    { value: 'finalizado', label: 'Finalizado', icon: '🏁' }
  ];

  activeView: 'active' | 'completed' = 'active';

  private subscription: Subscription = new Subscription();

  constructor(
    private trackingService: TrackingService,
    private cdRef: ChangeDetectorRef // ← AGREGAR ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('✅ AdminTrackingComponent inicializado');
    
    // ✅ SUSCRIBIRSE AL ESTADO DE LOADING (como el Stock)
    this.subscription.add(
      this.trackingService.loading$.subscribe(loading => {
        this.loading = loading;
        this.cdRef.detectChanges(); // ← FORZAR ACTUALIZACIÓN
      })
    );

    // ✅ SUSCRIBIRSE A LOS PEDIDOS (como el Stock)
    this.subscription.add(
      this.trackingService.orders$.subscribe((orders: OrderTracking[]) => {
        console.log('📦 Pedidos recibidos via Observable:', orders.length);
        this.orders = orders;
        this.filteredOrders = [...orders];
        this.calculateStats();
        this.cdRef.detectChanges(); // ← FORZAR ACTUALIZACIÓN
      })
    );

    // ✅ CARGAR PEDIDOS INICIALES
    this.loadOrders();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadOrders() {
    console.log('🔄 Cargando pedidos...');
    this.loading = true;
    
    // ✅ CARGAR PEDIDOS ACTIVOS
    this.trackingService.getAllOrders().subscribe({
      next: (orders: OrderTracking[]) => {
        console.log('📦 Pedidos activos cargados:', orders.length);
        this.orders = orders;
        this.filteredOrders = [...orders];
        this.calculateStats();
        
        // ✅ CARGAR PEDIDOS FINALIZADOS
        this.loadCompletedOrders();
      },
      error: (error: any) => {
        console.error('❌ Error loading orders:', error);
        alert('Error al cargar los pedidos: ' + error.message);
        this.loading = false;
      }
    });
  }

  // ✅ NUEVO: Cargar pedidos finalizados
  loadCompletedOrders() {
    this.trackingService.getCompletedOrders().subscribe({
      next: (orders: OrderTracking[]) => {
        console.log('📦 Pedidos finalizados cargados:', orders.length);
        this.completedOrders = orders;
        this.stats.finalizados = orders.length;
        this.loading = false;
        this.cdRef.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Error loading completed orders:', error);
        this.completedOrders = [];
        this.loading = false;
        this.cdRef.detectChanges();
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
      order.status === 'entregado'
    ).length;
    // finalizados se calcula en loadCompletedOrders
    
    this.cdRef.detectChanges();
  }

  // ✅ NUEVO: Cambiar entre vistas
  setActiveView(view: 'active' | 'completed') {
    this.activeView = view;
    this.selectedOrder = null;
    this.searchTerm = '';
    this.currentFilter = '';
    this.cdRef.detectChanges();
  }

  // ✅ NUEVO: Verificar si estamos en vista activos
  isActiveView(): boolean {
    return this.activeView === 'active';
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
    this.cdRef.detectChanges(); // ← ACTUALIZAR FILTROS
  }

  filterByStatus(filter: string) {
    this.currentFilter = filter;
    this.applyCurrentFilter();
  }

  applyCurrentFilter() {
    if (!this.currentFilter) {
      this.filteredOrders = this.orders;
    } else {
      this.filteredOrders = this.applyStatusFilter(this.orders, this.currentFilter);
    }
    this.cdRef.detectChanges(); // ← ACTUALIZAR FILTROS
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
    this.cdRef.detectChanges(); // ← ACTUALIZAR MODAL
  }

  closeOrderDetails() {
    this.selectedOrder = null;
    this.cdRef.detectChanges(); // ← ACTUALIZAR MODAL
  }

  updateOrderStatus(order: OrderTracking, newStatus: string) {
  // ✅ USAR order_id si id no está disponible
  const orderId = order.id || order.order_id;
  
  if (!orderId) {
    console.error('❌ No se puede encontrar ID del pedido:', order);
    alert('Error: No se puede identificar el pedido');
    return;
  }

  console.log('🔄 Actualizando estado:', {
    orderId: orderId,
    trackingCode: order.tracking_code,
    currentStatus: order.status,
    newStatus: newStatus
  });

  this.trackingService.updateOrderStatus(orderId, newStatus, order.payment_verified).subscribe({
    next: (updatedOrder: OrderTracking) => {
      console.log('✅ Estado actualizado exitosamente:', updatedOrder);
      
      // Actualización manual inmediata
      const index = this.orders.findIndex(o => (o.id === orderId) || (o.order_id === orderId));
      if (index !== -1) {
        this.orders[index] = updatedOrder;
        this.filteredOrders = [...this.orders];
        this.calculateStats();
        this.cdRef.detectChanges();
      }

      if (this.selectedOrder && (this.selectedOrder.id === orderId || this.selectedOrder.order_id === orderId)) {
        this.selectedOrder = updatedOrder;
      }

      this.showNotification(`Estado actualizado a: ${this.getStatusText(newStatus)}`);
    },
    error: (error: any) => {
      console.error('❌ Error actualizando estado:', error);
      alert('Error al actualizar el estado del pedido: ' + error.message);
    } 
  });
}

  togglePaymentStatus(order: OrderTracking) {
    const newPaymentStatus = !order.payment_verified;
    console.log('💳 Actualizando pago:', order.tracking_code, '->', newPaymentStatus);
    
    this.trackingService.updatePaymentStatus(order.id!, newPaymentStatus).subscribe({
      next: (updatedOrder: OrderTracking) => {
        console.log('✅ Pago actualizado:', updatedOrder);
        this.showNotification(`Pago ${newPaymentStatus ? 'verificado' : 'marcado como pendiente'}`);
        // El BehaviorSubject ya actualiza automáticamente la lista
      },
      error: (error: any) => {
        console.error('❌ Error updating payment:', error);
        alert('Error al actualizar el estado del pago');
      }
    });
  }

  // ... (los demás métodos getOrderCardClass, getStatusBadgeClass, etc. se mantienen igual)

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

  getChangeAmount(order: OrderTracking): number {
    if (order.payment_method === 'efectivo' && order.delivery_address?.cashAmount) {
      const cashAmount = order.delivery_address.cashAmount;
      const total = order.total_amount || 0;
      return cashAmount - total;
    }
    return 0;
  }

  showNotification(message: string) {
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

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }
}