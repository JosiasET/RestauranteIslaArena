import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../core/interface/cart.services';

@Component({
  selector: 'app-mycart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mycart.html',
  styleUrl: './mycart.css'
})
export class Mycart implements OnInit, OnDestroy {
  
  minutes: number = 9;
  seconds: number = 59;
  private timerInterval: any;
  cartItems: CartItem[] = [];
  private mostradoAlertaUnMinuto: boolean = false;

  constructor(
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.cartItems = this.cartService.getCartItems();
    this.startTimer();
  }

  ngOnDestroy() {
    this.stopTimer();
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

    // Mostrar alerta cuando quede 1 minuto (solo una vez)
    if (this.minutes === 1 && this.seconds === 0 && !this.mostradoAlertaUnMinuto) {
      this.mostrarAlertaUnMinuto();
      this.mostradoAlertaUnMinuto = true;
    }

    // Mostrar alerta cuando queden 10 segundos
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
      // Puedes agregar una notificación visual más sutil aquí
    }
  }

  private eliminarProductosPorTiempo() {
    if (this.cartItems.length > 0) {
      // Mostrar mensaje en la interfaz
      this.mostrarMensajeTiempoAgotado();
      
      // Esperar 3 segundos para que el usuario vea el mensaje, luego borrar
      setTimeout(() => {
        this.cartService.clearCart();
        this.cartItems = [];
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
    console.log('Cart items:', this.cartItems); // ← Agregar esto
    console.log('Cart length:', this.cartItems.length); // ← Agregar esto
  
    if (this.cartItems.length > 0) {
    console.log('Navegando a checkout...'); // ← Agregar esto
    this.router.navigate(['/checkout']);
      } else {
      console.log('Carrito vacío'); // ← Agregar esto
      alert('Tu carrito está vacío. Agrega productos antes de finalizar el pedido.');
    }
  }

  continueShopping() {
    this.router.navigate(['/Home']);
  }
}