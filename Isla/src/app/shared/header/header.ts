import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MycartDrawer } from '../mycart-drawer/mycart-drawer';
import { Home } from "../../pages/home/home"; 

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [RouterLink, CommonModule, RouterOutlet, MycartDrawer, Home],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  homeActive: boolean = true;
  cartItemCount: number = 0;

  constructor(private router: Router) {}

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
    
    // Si vamos a una sección específica, forzar navegación
    if (!state) {
      setTimeout(() => {
        // Esto ayuda a que Angular procese la navegación correctamente
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
}