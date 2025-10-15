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
  imports: [RouterLink, CommonModule, RouterOutlet, MycartDrawer, Home], // ← AGREGAR Home aquí
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  homeActive: boolean = true;

  constructor(private router: Router) {}

  goHome() {
    if (!this.homeActive) {
      this.homeActive = true;
      this.router.navigateByUrl('/Home');
    }
  }

  setHome(state: boolean) {
    this.homeActive = state;
  }

  // NUEVO MÉTODO PARA IR AL CARRITO
  goToCart() {
    this.homeActive = false;
    this.router.navigate(['/cart']); 
  }
}