import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TrackingService, OrderTracking } from '../../../core/service/tracking.service';

// Interfaces (se mantienen igual)
interface OrderItem {
  id?: number;
  nombre: string;
  cantidad: number;
  precio: number;
  order_id?: number;
  product_id?: number;
}

interface DeliveryAddress {
  address?: string;
  neighborhood?: string;
  city?: string;
  references?: string;
  cashAmount?: number;
}

interface SafeOrderTracking {
  id?: number;
  order_id?: number;
  tracking_code: string;
  customer_name: string;
  customer_phone?: string;
  order_date: string;
  status: string;
  payment_method?: string;
  payment_verified: boolean;
  total_amount: number;
  order_items: OrderItem[];
  delivery_address?: DeliveryAddress;
  order_type?: string; // ✅ AGREGAR ESTA LÍNEA
    payment_reference?: string; // ✅ NUEVO: Agregar esta línea 
}

@Component({
  selector: 'app-admin-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-tracking.html',
  styleUrls: ['./admin-tracking.css']
})
export class AdminTrackingComponent implements OnInit, OnDestroy {
  // Arrays de pedidos
  orders: SafeOrderTracking[] = [];
  filteredOrders: SafeOrderTracking[] = [];
  completedOrders: SafeOrderTracking[] = [];

  // Estados
  loading: boolean = true;
  searchTerm: string = '';
  selectedOrder: SafeOrderTracking | null = null;
  currentFilter: string = '';
  activeView: 'active' | 'completed' = 'active';

  // Estadísticas
  stats = {
    en_proceso: 0,
    en_camino: 0,
    entregados: 0,
    finalizados: 0
  };

  // Opciones de estado
  statusOptions = [
    { value: 'pedido_recibido', label: 'Recibido', icon: '📥' },
    { value: 'pago_verificado', label: 'Pago Verificado', icon: '💳' },
    { value: 'en_preparacion', label: 'En Preparación', icon: '👨‍🍳' },
    { value: 'en_camino', label: 'En Camino', icon: '🚚' },
    { value: 'entregado', label: 'Entregado', icon: '✅' },
    { value: 'finalizado', label: 'Finalizar', icon: '🏁' }
  ];

  private subscription: Subscription = new Subscription();

  constructor(
    private trackingService: TrackingService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('✅ AdminTrackingComponent inicializado');
    
    // Suscribirse al estado de loading
    this.subscription.add(
      this.trackingService.loading$.subscribe(loading => {
        this.loading = loading;
        this.cdRef.detectChanges();
      })
    );

    // Suscribirse a los pedidos activos
    this.subscription.add(
      this.trackingService.orders$.subscribe((orders: any[]) => {
        console.log('📦 Pedidos activos recibidos:', orders.length);
        // Convertir a SafeOrderTracking para asegurar tipos seguros
        this.orders = this.sanitizeOrders(orders);
        
        // Filtrar inmediatamente para excluir finalizados de la vista activa
        this.filteredOrders = this.getActiveOrders();
        this.calculateStats();
        
        // Establecer filtro por defecto: mostrar todos los activos
        this.currentFilter = '';
        
        this.cdRef.detectChanges();
      })
    );

    // Cargar datos iniciales
    this.loadOrders();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // Obtener solo pedidos activos (no finalizados)
  private getActiveOrders(): SafeOrderTracking[] {
    return this.orders.filter(order => order.status !== 'finalizado');
  }

  // Sanitizar órdenes para asegurar tipos seguros
  private sanitizeOrders(orders: any[]): SafeOrderTracking[] {
  return orders.map(order => ({
    id: order.id || order.order_id || 0,
    order_id: order.order_id || order.id || 0,
    tracking_code: order.tracking_code || 'N/A',
    customer_name: order.customer_name || 'Cliente no especificado',
    customer_phone: order.customer_phone || '',
    order_date: order.order_date || new Date().toISOString(),
    status: order.status || 'pedido_recibido',
    payment_method: order.payment_method || 'efectivo',
    payment_verified: order.payment_verified || false,
    total_amount: order.total_amount || 0,
    order_items: order.order_items || [],
    delivery_address: order.delivery_address || {},
    order_type: order.order_type || 'takeaway', // ✅ AGREGAR order_type
    payment_reference: order.payment_reference || '' // ✅ AGREGAR payment_reference
  }));
}

  // Cargar todos los pedidos
  loadOrders() {
    console.log('🔄 Cargando pedidos...');
    this.loading = true;
    
    this.trackingService.getAllOrders().subscribe({
      next: (orders: any[]) => {
        console.log('📦 Pedidos activos cargados:', orders.length);
        this.orders = this.sanitizeOrders(orders);
        
        // Filtrar inmediatamente para excluir finalizados
        this.filteredOrders = this.getActiveOrders();
        this.calculateStats();
        
        // Cargar pedidos finalizados si estamos en esa vista
        if (this.activeView === 'completed') {
          this.loadCompletedOrders();
        } else {
          this.loading = false;
        }
        this.cdRef.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Error loading orders:', error);
        this.showNotification('❌ Error al cargar los pedidos');
        this.loading = false;
        this.cdRef.detectChanges();
      }
    });
  }

  // Cargar pedidos finalizados
  loadCompletedOrders() {
    this.trackingService.getCompletedOrders().subscribe({
      next: (orders: any[]) => {
        console.log('📦 Pedidos finalizados cargados:', orders.length);
        this.completedOrders = this.sanitizeOrders(orders);
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

  // Calcular estadísticas - SOLO de pedidos activos
  calculateStats() {
    const activeOrders = this.getActiveOrders();
    
    this.stats.en_proceso = activeOrders.filter(order => 
      order.status === 'en_preparacion'
    ).length;
    
    this.stats.en_camino = activeOrders.filter(order => 
      order.status === 'en_camino'
    ).length;
    
    this.stats.entregados = activeOrders.filter(order => 
      order.status === 'entregado'
    ).length;
    
    this.cdRef.detectChanges();
  }

  // Cambiar entre vistas principales
  setActiveView(view: 'active' | 'completed') {
    this.activeView = view;
    this.selectedOrder = null;
    this.searchTerm = '';
    
    if (view === 'active') {
      // En vista activa, mostrar solo pedidos no finalizados
      this.currentFilter = '';
      this.filteredOrders = this.getActiveOrders();
    } else {
      // En vista finalizados, cargar pedidos finalizados si es necesario
      if (this.completedOrders.length === 0) {
        this.loadCompletedOrders();
      }
    }
    
    this.cdRef.detectChanges();
  }

  // Obtener conteo de pedidos activos
  getActiveOrdersCount(): number {
    return this.stats.en_proceso + this.stats.en_camino + this.stats.entregados;
  }

  // Filtrar pedidos por búsqueda
  filterOrders() {
    if (!this.searchTerm) {
      this.applyCurrentFilter();
      return;
    }

    const term = this.searchTerm.toLowerCase();
    
    // Buscar solo en pedidos activos
    let filtered = this.getActiveOrders().filter(order => 
      order.tracking_code.toLowerCase().includes(term) ||
      order.customer_name.toLowerCase().includes(term) ||
      (order.customer_phone && order.customer_phone.includes(term))
    );

    // Aplicar filtro actual si existe
    if (this.currentFilter) {
      filtered = this.applyStatusFilter(filtered, this.currentFilter);
    }

    this.filteredOrders = filtered;
    this.cdRef.detectChanges();
  }

  // Filtrar por estado
  filterByStatus(filter: string) {
    this.currentFilter = filter;
    this.applyCurrentFilter();
  }

  // Aplicar filtro actual
  applyCurrentFilter() {
    if (!this.currentFilter) {
      // Mostrar todos los pedidos activos
      this.filteredOrders = this.getActiveOrders();
    } else {
      this.filteredOrders = this.applyStatusFilter(this.getActiveOrders(), this.currentFilter);
    }
    this.cdRef.detectChanges();
  }

  // Aplicar filtro de estado específico
  applyStatusFilter(orders: SafeOrderTracking[], filter: string): SafeOrderTracking[] {
    switch (filter) {
      case 'en_proceso':
        return orders.filter(order => order.status === 'en_preparacion');
      case 'en_camino':
        return orders.filter(order => order.status === 'en_camino');
      case 'entregados':
        return orders.filter(order => order.status === 'entregado');
      default:
        return orders;
    }
  }

  // Obtener texto del filtro actual
  getCurrentFilterText(): string {
    const filterTexts: { [key: string]: string } = {
      'en_proceso': 'en proceso',
      'en_camino': 'en camino', 
      'entregados': 'entregados'
    };
    return filterTexts[this.currentFilter] || 'activos';
  }

  // Abrir modal de detalles
  openOrderDetails(order: SafeOrderTracking) {
    this.selectedOrder = order;
    console.log('📋 Abriendo detalles del pedido:', order.tracking_code);
    this.cdRef.detectChanges();
  }

  // Cerrar modal de detalles
  closeOrderDetails() {
    this.selectedOrder = null;
    this.cdRef.detectChanges();
  }

  // Actualizar estado del pedido
  updateOrderStatus(order: SafeOrderTracking, newStatus: string) {
    const orderId = order.id || order.order_id;
    
    if (!orderId) {
      console.error('❌ No se puede encontrar ID del pedido:', order);
      this.showNotification('❌ Error: No se puede identificar el pedido');
      return;
    }

    console.log('🔄 Actualizando estado:', {
      orderId: orderId,
      trackingCode: order.tracking_code,
      currentStatus: order.status,
      newStatus: newStatus
    });

    this.trackingService.updateOrderStatus(orderId, newStatus, order.payment_verified).subscribe({
      next: (updatedOrder: any) => {
        console.log('✅ Estado actualizado exitosamente:', updatedOrder);
        
        const safeUpdatedOrder = this.sanitizeOrders([updatedOrder])[0];
        
        // Actualizar en el array correspondiente
        if (newStatus === 'finalizado') {
          // Remover de pedidos activos y agregar a finalizados
          const orderIndex = this.orders.findIndex(o => (o.id === orderId) || (o.order_id === orderId));
          if (orderIndex !== -1) {
            this.orders[orderIndex] = safeUpdatedOrder;
          }
          
          // Actualizar las listas filtradas
          this.filteredOrders = this.getActiveOrders(); // Excluir el finalizado
          this.completedOrders.unshift(safeUpdatedOrder);
          this.stats.finalizados++;
          this.calculateStats();
        } else {
          // Actualizar en pedidos activos
          const index = this.orders.findIndex(o => (o.id === orderId) || (o.order_id === orderId));
          if (index !== -1) {
            this.orders[index] = safeUpdatedOrder;
            this.filteredOrders = this.getActiveOrders(); // Re-filtrar
          }
        }
        
        if (this.selectedOrder && (this.selectedOrder.id === orderId || this.selectedOrder.order_id === orderId)) {
          this.selectedOrder = safeUpdatedOrder;
        }

        this.showNotification(`✅ Estado actualizado a: ${this.getStatusText(newStatus)}`);
        this.cdRef.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Error actualizando estado:', error);
        this.showNotification('❌ Error al actualizar el estado del pedido');
      } 
    });
  }

  // Alternar estado de pago
  togglePaymentStatus(order: SafeOrderTracking) {
    if (!order.id) {
      console.error('❌ No se puede encontrar ID del pedido para actualizar pago:', order);
      this.showNotification('❌ Error: No se puede identificar el pedido');
      return;
    }

    const newPaymentStatus = !order.payment_verified;
    console.log('💳 Actualizando pago:', order.tracking_code, '->', newPaymentStatus);
    
    this.trackingService.updatePaymentStatus(order.id, newPaymentStatus).subscribe({
      next: (updatedOrder: any) => {
        console.log('✅ Pago actualizado:', updatedOrder);
        this.showNotification(`💳 Pago ${newPaymentStatus ? 'verificado ✅' : 'marcado como pendiente ⏳'}`);
        
        // Actualizar en la lista
        const orderId = order.id || order.order_id;
        const index = this.orders.findIndex(o => (o.id === orderId) || (o.order_id === orderId));
        if (index !== -1) {
          this.orders[index] = this.sanitizeOrders([updatedOrder])[0];
          this.filteredOrders = this.getActiveOrders(); // Re-filtrar
        }
        
        if (this.selectedOrder && (this.selectedOrder.id === orderId || this.selectedOrder.order_id === orderId)) {
          this.selectedOrder = this.sanitizeOrders([updatedOrder])[0];
        }
        
        this.cdRef.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Error updating payment:', error);
        this.showNotification('❌ Error al actualizar el estado del pago');
      }
    });
  }

  getOrderType(order: SafeOrderTracking): string {
  return order.order_type || 'takeaway'; // Por defecto online para compatibilidad
}

// Obtener texto del tipo de pedido
getOrderTypeText(order: SafeOrderTracking): string {
  const type = this.getOrderType(order);
  return type === 'eat_in' ? '🍽️ Mesa' : '📱 Online';
}

// Obtener información de la mesa para pedidos internos
getTableInfo(order: SafeOrderTracking): string {
  if (this.getOrderType(order) === 'eat_in' && order.delivery_address) {
    const address = order.delivery_address.address || '';
    if (address.includes('Mesa')) {
      return address;
    }
  }
  return 'Mesa no especificada';
}

// ✅ CORREGIDO: Obtener monto en efectivo
getCashAmount(order: SafeOrderTracking): number {
  console.log('💰 Buscando cashAmount en:', order);
  
  if (order.payment_method === 'efectivo') {
    // 1. Buscar en delivery_address.cashAmount
    if (order.delivery_address?.cashAmount) {
      console.log('✅ CashAmount encontrado en delivery_address:', order.delivery_address.cashAmount);
      return order.delivery_address.cashAmount;
    }
    
    // 2. Buscar en payment_reference
    if (order.payment_reference) {
      console.log('🔍 Buscando en payment_reference:', order.payment_reference);
      // Buscar patrones como "Efectivo - Cambio: 48" o "Paga con: 200"
      const amountMatch = order.payment_reference.match(/(\d+\.?\d*)/g);
      if (amountMatch && amountMatch.length > 0) {
        const possibleAmount = parseFloat(amountMatch[0]);
        if (possibleAmount > order.total_amount) {
          console.log('✅ CashAmount encontrado en payment_reference:', possibleAmount);
          return possibleAmount;
        }
      }
    }
  }
  
  console.log('❌ CashAmount no encontrado, usando total:', order.total_amount);
  return order.total_amount || 0;
}

// Obtener cambio (corregido)

  // Los métodos de utilidad se mantienen igual...
  getOrderCardClass(order: SafeOrderTracking): string {
  const statusClassMap: { [key: string]: string } = {
    'pedido_recibido': 'status-received',
    'pago_verificado': 'status-verified',
    'en_preparacion': 'status-preparing',
    'en_camino': 'status-shipping',
    'entregado': 'status-delivered',
    'finalizado': 'status-completed'
  };
  
  let baseClass = statusClassMap[order.status] || '';
  
  // AGREGAR: Clase según tipo de pedido
  if (this.getOrderType(order) === 'eat_in') {
    baseClass += ' internal-order';
  } else {
    baseClass += ' online-order';
  }
  
  return baseClass;
}

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pedido_recibido': 'badge-received',
      'pago_verificado': 'badge-verified',
      'en_preparacion': 'badge-preparing',
      'en_camino': 'badge-shipping',
      'entregado': 'badge-delivered',
      'finalizado': 'badge-completed'
    };
    return statusClasses[status] || 'badge-default';
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
      'efectivo': '💵 Efectivo',
      'tarjeta': '💳 Tarjeta'
    };
    return methods[method] || method;
  }

  getTimeAgo(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
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
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  getChangeAmount(order: SafeOrderTracking): number {
  if (order.payment_method === 'efectivo') {
    const cashAmount = this.getCashAmount(order);
    const total = order.total_amount || 0;
    const change = cashAmount - total;
    
    console.log('🧮 Cálculo de cambio:', {
      cashAmount,
      total, 
      change
    });
    
    return change;
  }
  return 0;
}

  // Método seguro para obtener items de orden
  getOrderItems(order: SafeOrderTracking): OrderItem[] {
    return order.order_items || [];
  }

  // Método seguro para obtener dirección de entrega
  getDeliveryAddress(order: SafeOrderTracking): DeliveryAddress {
    return order.delivery_address || {};
  }

  // Mostrar notificación
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
      max-width: 300px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }

  hasOnlineOrders(): boolean {
  return this.filteredOrders.some(order => this.getOrderType(order) === 'takeaway');
}

hasMesaOrders(): boolean {
  return this.filteredOrders.some(order => this.getOrderType(order) === 'eat_in');
}

countOnlineOrders(): number {
  return this.filteredOrders.filter(order => this.getOrderType(order) === 'takeaway').length;
}

countMesaOrders(): number {
  return this.filteredOrders.filter(order => this.getOrderType(order) === 'eat_in').length;
}

debugClick(order: SafeOrderTracking) {
  console.log('🎯 CLICK EN CARD:', order.tracking_code);
  console.log('🔍 Order object:', order);
  this.openOrderDetails(order);
}
  
}