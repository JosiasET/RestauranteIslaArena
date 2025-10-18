import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../core/interface/cart.services';

@Component({
  selector: 'app-mycart-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mycart-drawer.html',
  styleUrl: './mycart-drawer.css'
})
export class MycartDrawer implements OnInit, OnDestroy {
  
  minutes: number = 9;
  seconds: number = 59;
  private timerInterval: any;
  cartItems: CartItem[] = [];
  isVisible: boolean = false;
  private mostradoAlertaUnMinuto: boolean = false;

  constructor(
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.cartService.cartVisible$.subscribe((visible: boolean) => {
      this.isVisible = visible;
      if (visible) {
        this.cartItems = this.cartService.getCartItems();
        this.startTimer();
      } else {
        this.stopTimer();
      }
    });
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  closeCart() {
    this.cartService.closeCart();
  }

  preventClose(event: Event) {
    event.stopPropagation();
  }

  private startTimer() {
    this.timerInterval = setInterval(() => {
      this.updateTimer();
      this.cdRef.detectChanges();
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private updateTimer() {
    if (this.seconds > 0) {
      this.seconds--;
    } else {
      if (this.minutes > 0) {
        this.minutes--;
        this.seconds = 59;
      } else {
        this.stopTimer();
        this.eliminarProductosPorTiempo();
        return;
      }
    }

    if (this.minutes === 1 && this.seconds === 0 && !this.mostradoAlertaUnMinuto) {
      this.mostrarAlertaUnMinuto();
      this.mostradoAlertaUnMinuto = true;
    }

    if (this.minutes === 0 && this.seconds === 10) {
      this.mostrarAlertaDiezSegundos();
    }
  }

  private mostrarAlertaUnMinuto() {
    if (this.cartItems.length > 0) {
      alert('⚠️ ¡SOLO 1 MINUTO! Tu reserva está por expirar. Completa tu compra pronto.');
    }
  }

  private mostrarAlertaDiezSegundos() {
    if (this.cartItems.length > 0) {
      console.log('⏰ ¡Solo 10 segundos restantes!');
    }
  }

  private eliminarProductosPorTiempo() {
    if (this.cartItems.length > 0) {
      this.mostrarMensajeTiempoAgotado();
      
      setTimeout(() => {
        this.cartService.clearCart();
        this.cartItems = [];
        this.closeCart();
        alert('⏰ ¡TIEMPO AGOTADO! Los productos han sido removidos de tu carrito.');
      }, 3000);
    }
  }

  private mostrarMensajeTiempoAgotado() {
    const alertElement = document.querySelector('.reservation-alert');
    if (alertElement) {
      alertElement.innerHTML = `
        <div style="color: #d9534f; font-weight: bold; padding: 15px; text-align: center;">
          ⏰ ¡TIEMPO AGOTADO! Eliminando productos en 3 segundos...
        </div>
      `;
    }
  }

  get formattedTime(): string {
    return `${this.minutes.toString().padStart(2, '0')}:${this.seconds.toString().padStart(2, '0')}`;
  }

  getTotal(): number {
    return this.cartService.getTotal();
  }

  eliminarProducto(itemId: number) {
    this.cartService.removeFromCart(itemId);
    this.cartItems = this.cartService.getCartItems();
  }

  finalizarPedido() {
    if (this.cartItems.length > 0) {
      this.closeCart();
      this.router.navigate(['/checkout']);
    } else {
      alert('Tu carrito está vacío. Agrega productos antes de finalizar el pedido.');
    }
  }

  // En el método continueShopping, cambiamos el comportamiento
continueShopping() {
  this.closeCart();
  // NO navega al Home, simplemente cierra el carrito
  // El usuario se queda en la página donde estaba
}
}