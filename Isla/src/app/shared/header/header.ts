import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ← AGREGAR
import { MycartDrawer } from '../mycart-drawer/mycart-drawer';
import { Home } from "../../pages/client/home/home"; 
import { TrackingService, OrderTracking } from '../../core/service/tracking.service'; // ← AGREGAR

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [RouterLink, CommonModule, RouterOutlet, MycartDrawer, Home, FormsModule], // ← AGREGAR FormsModule
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  homeActive: boolean = true;
  cartItemCount: number = 0;
  menuOpen = false;

  // Variables para búsqueda de pedidos
  showOrderSearch: boolean = false;
  orderSearchTerm: string = '';
  orderSearchLoading: boolean = false;
  orderSearchError: string = '';
  searchedOrder: OrderTracking | null = null;

  // Opciones de estado
  statusOptions = [
    { value: 'pedido_recibido', label: 'Recibido', icon: '📥' },
    { value: 'pago_verificado', label: 'Pago Verificado', icon: '💳' },
    { value: 'en_preparacion', label: 'En Preparación', icon: '👨‍🍳' },
    { value: 'en_camino', label: 'En Camino', icon: '🚚' },
    { value: 'entregado', label: 'Entregado', icon: '✅' },
    { value: 'finalizado', label: 'Finalizado', icon: '🏁' }
  ];

  constructor(
    private router: Router,
    private trackingService: TrackingService // ← AGREGAR
  ) {}

  // Métodos existentes del header (MANTENER)
  goHome() {
    console.log('🏠 Navegando a home...');
    if (!this.homeActive) {
      this.homeActive = true;
      this.router.navigate(['/']).then(() => {
        console.log('✅ Navegación a home completada');
      });
    }
  }

  setHome(state: boolean) {
    console.log('🔄 Cambiando estado home a:', state);
    this.homeActive = state;
    
    if (!state) {
      setTimeout(() => {
        this.router.navigate([this.router.url]);
      }, 50);
    }
  }

  goToCart() {
    console.log('🛒 Navegando al carrito...');
    this.homeActive = false;
    this.router.navigate(['/cart']).then(() => {
      console.log('✅ Navegación al carrito completada');
    });
  }

  updateCartCount(count: number) {
    this.cartItemCount = count;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  // MÉTODOS NUEVOS PARA BÚSQUEDA DE PEDIDOS
  openOrderSearch() {
    this.showOrderSearch = true;
    this.orderSearchTerm = '';
    this.searchedOrder = null;
    this.orderSearchError = '';
    
    // Enfocar el input después de que se abra el modal
    setTimeout(() => {
      const input = document.querySelector('.search-modal-input') as HTMLInputElement;
      if (input) input.focus();
    }, 100);
  }

  closeOrderSearch() {
    this.showOrderSearch = false;
    this.orderSearchTerm = '';
    this.searchedOrder = null;
    this.orderSearchError = '';
    this.orderSearchLoading = false;
  }

  searchOrder() {
    if (!this.orderSearchTerm.trim()) {
      this.searchedOrder = null;
      this.orderSearchError = '';
      return;
    }

    this.orderSearchLoading = true;
    this.orderSearchError = '';
    this.searchedOrder = null;

    this.trackingService.getOrderByCode(this.orderSearchTerm).subscribe({
      next: (order: OrderTracking) => {
        this.searchedOrder = order;
        this.orderSearchLoading = false;
      },
      error: (error: any) => {
        console.error('Error buscando pedido:', error);
        this.orderSearchError = 'Pedido no encontrado';
        this.orderSearchLoading = false;
        this.searchedOrder = null;
      }
    });
  }

  // Métodos auxiliares para mostrar estados
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

  getTimelineStatusClass(currentStatus: string, targetStatus: string): string {
    const statusOrder = [
      'pedido_recibido',
      'pago_verificado', 
      'en_preparacion',
      'en_camino',
      'entregado'
    ];
    
    const currentIndex = statusOrder.indexOf(currentStatus);
    const targetIndex = statusOrder.indexOf(targetStatus);
    
    if (targetIndex < currentIndex) return 'timeline-completed';
    if (targetIndex === currentIndex) return 'timeline-active';
    return 'timeline-pending';
  }
}